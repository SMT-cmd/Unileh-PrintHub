// 1. Dependency Check & Initialization
const checkDashboardDeps = setInterval(() => {
    if (window.supabaseClient && window.storageService) {
        clearInterval(checkDashboardDeps);
        initDashboard();
    }
}, 100);

function initDashboard() {
    console.log("Initializing Admin Dashboard Logic...");
    const sb = window.supabaseClient;

    // --- Safe output helpers ---
    // Everything a visitor can submit (names, messages, URLs...) is untrusted.
    // Always pass it through esc() before putting it into HTML, and through
    // attrUrl() before putting it into an href/src attribute.
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const safeUrl = (value) => {
        if (!value) return '';
        try {
            const u = new URL(String(value), window.location.href);
            return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : '#';
        } catch (e) {
            return '#';
        }
    };
    const attrUrl = (value) => esc(safeUrl(value));

    const num = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    // Builds the object a row builder receives, falling back to created_at
    // when the form did not save its own timestamp.
    const merge = (row, extra) => ({
        ...(row.data || {}),
        timestamp: (row.data && row.data.timestamp) || row.created_at,
        ...extra
    });

    // --- Daily Accounting ---
    function updateDailySummary(orders) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyOrders = orders.filter(order => {
            const ts = (order.data && order.data.timestamp) || order.created_at;
            if (!ts) return false;
            const orderDate = new Date(ts);
            return orderDate >= today && order.status === 'Collected';
        });

        const totalAmount = dailyOrders.reduce((sum, order) => sum + num(order.data && order.data.totalPrice), 0);

        const amountEl = document.getElementById('daily-total-amount');
        const countEl = document.getElementById('daily-order-count');

        if (amountEl) amountEl.textContent = `₦${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (countEl) countEl.textContent = `${dailyOrders.length} orders collected today`;
    }

    // --- Generic table loader + realtime refresh ---
    function watchTable(table, orderColumn, ascending, render) {
        const load = async () => {
            const { data, error } = await sb.from(table).select('*').order(orderColumn, { ascending });
            if (error) { console.error(`Error loading ${table}:`, error); return; }
            render(data || []);
        };
        load();
        sb.channel(table + '-admin')
          .on('postgres_changes', { event: '*', schema: 'public', table }, load)
          .subscribe();
    }

    // Fills a table body; one malformed row is skipped instead of breaking the table
    function fill(bodyId, rows, build) {
        const body = document.getElementById(bodyId);
        if (!body) return;
        body.innerHTML = '';
        rows.forEach((row) => {
            try {
                body.appendChild(build(row));
            } catch (err) {
                console.error(`Skipped a malformed row in ${bodyId}:`, row && row.id, err);
            }
        });
    }

    // Orders
    watchTable('orders', 'created_at', false, (rows) => {
        fill('orders-body', rows, (row) => createOrderRow(row.id, merge(row, { status: row.status, orderNumber: row.order_number })));
        updateDailySummary(rows);
    });

    // Portal Requests — includes the raw password column, split off from `data`
    watchTable('portal_requests', 'created_at', false, (rows) => {
        fill('portal-body', rows, (row) => createPortalRow(row.id, merge(row, {
            status: row.status,
            portalPassword: row.portal_password_plain
        })));
    });

    // Project & Seminar Requests
    watchTable('project_requests', 'created_at', false, (rows) => {
        fill('project-body', rows, (row) => createProjectRow(row.id, merge(row, { status: row.status })));
    });

    // Feedback
    watchTable('feedback_suggestions', 'created_at', false, (rows) => {
        fill('feedback-body', rows, (row) => createFeedbackRow(row.id, merge(row, { status: row.status })));
    });

    // Adverts
    watchTable('adverts', 'start_date', false, (rows) => {
        fill('adverts-body', rows, (row) => createAdRow(row.id, { ...row.data, startDate: row.start_date, endDate: row.end_date }));
    });

    // Advert Requests
    watchTable('advert_requests', 'created_at', false, (rows) => {
        fill('advert-requests-body', rows, (row) => createAdvertRequestRow(row.id, merge(row, { status: row.status })));
    });

    // Announcements
    watchTable('announcements', 'expiry_date', false, (rows) => {
        fill('announcements-body', rows, (row) => createAnnouncementRow(row.id, { ...row.data, expiryDate: row.expiry_date }));
    });

    // Partners
    watchTable('partners', 'name', true, (rows) => {
        fill('partners-body', rows, (row) => createPartnerRow(row.id, { ...row.data, name: row.name }));
    });

    // Gadgets
    watchTable('gadget_products', 'created_at', false, (rows) => {
        fill('gadgets-body', rows, (row) => createGadgetRow(row.id, { category: row.category, ...row.data }));
    });

    // Housing
    watchTable('housing_listings', 'created_at', false, (rows) => {
        fill('housing-body', rows, (row) => createHousingRow(row.id, { type: row.type, pricePeriod: row.price_period, ...row.data }));
    });

    // --- Row Creation Helpers ---
    // Buttons use data-* attributes and one delegated click handler (see the
    // bottom of this file) instead of inline onclick, so visitor-submitted
    // text can never become code.

    function createOrderRow(id, order) {
        const tr = document.createElement('tr');
        const date = new Date(order.timestamp).toLocaleString();

        let statusClass = 'status-pending';
        if (order.status === 'Printed') statusClass = 'status-printed';
        if (order.status === 'Ready') statusClass = 'status-ready';
        if (order.status === 'Collected') statusClass = 'status-collected';
        if (order.status === 'Paid') statusClass = 'status-paid';

        const receiptLink = order.receiptUrl
            ? `<a href="${attrUrl(order.receiptUrl)}" target="_blank" rel="noopener noreferrer" class="download-link">Receipt</a>`
            : `<span style="opacity:0.5; font-size:0.8em;">No Receipt</span>`;

        const displayId = order.orderNumber || `${String(id).substring(0, 5)}...`;
        const items = Array.isArray(order.items) && order.items.length
            ? order.items
            : [{
                fileUrl: order.fileUrl,
                fileId: order.fileId,
                fileName: order.fileName,
                pageCount: order.pageCount,
                copies: order.copies,
                printType: order.printType
            }];

        const fileLinks = items
            .filter((it) => it && it.fileUrl)
            .map((it, i) => `<a href="${attrUrl(it.fileUrl)}" target="_blank" rel="noopener noreferrer" class="download-link">File ${i + 1}</a>`)
            .join(' ');

        const fileIdsEncoded = encodeURIComponent(JSON.stringify(items.map((it) => it?.fileId).filter(Boolean)));

        const typeSet = new Set(items.map((it) => String(it?.printType || '').trim()).filter(Boolean));
        const printTypeLabel = typeSet.size > 1 ? 'Mixed' : (items[0]?.printType || order.printType || '-');

        const totalPagesPrinted = items.reduce((sum, it) => {
            const pages = parseInt(it?.pageCount) || 1;
            const copies = parseInt(it?.copies) || 1;
            return sum + pages * copies;
        }, 0);
        const priceBreakdown = `<span style="font-size: 0.8em; display: block; color: #666;">(${items.length} file${items.length === 1 ? '' : 's'} • ${totalPagesPrinted} pages printed)</span>`;

        tr.innerHTML = `
            <td title="Order ID: ${esc(id)}"><strong>${esc(displayId)}</strong></td>
            <td>${esc(order.studentName)}</td>
            <td>${esc(order.phoneNumber)}</td>
            <td>${esc(printTypeLabel)}</td>
            <td>${items.length} file${items.length === 1 ? '' : 's'}</td>
            <td>₦${num(order.totalPrice).toFixed(2)}${priceBreakdown}</td>
            <td>${fileLinks || '-'}</td>
            <td>${receiptLink}</td>
            <td>${esc(date)}</td>
            <td><span class="status-badge ${statusClass}">${esc(order.status)}</span></td>
            <td>
                <div class="action-group">
                    <button data-action="toggle-print-ready" data-id="${esc(id)}" data-status="${esc(order.status)}" data-name="${esc(order.studentName)}" data-phone="${esc(order.phoneNumber)}" class="action-button-small btn-ready">
                        ${order.status === 'Ready' ? 'Undo Ready' : 'Print Ready'}
                    </button>
                    <button data-action="mark-collected" data-id="${esc(id)}" class="action-button-small btn-collected" ${order.status === 'Collected' ? 'disabled' : ''}>
                        Collected
                    </button>
                    <button data-action="delete-order" data-id="${esc(id)}" data-file-ids="${esc(fileIdsEncoded)}" data-receipt-id="${esc(order.receiptId ?? '')}" class="action-button-small btn-delete">
                        Delete
                    </button>
                </div>
            </td>
        `;
        return tr;
    }

    function createPortalRow(id, request) {
        const tr = document.createElement('tr');
        const date = new Date(request.timestamp).toLocaleString();
        const statusClass = request.status === 'Handled' ? 'status-handled' : 'status-pending';
        const passwordCell = request.portalPassword
            ? `<code>${esc(request.portalPassword)}</code>`
            : `<span style="opacity:0.5; font-size:0.85em;">Expired / removed</span>`;

        tr.innerHTML = `
            <td>${esc(request.fullName)}</td>
            <td>${esc(request.matricNumber)}</td>
            <td>${esc(request.phoneNumber)}</td>
            <td>${esc(request.department)}</td>
            <td>${esc(request.level)}</td>
            <td>${esc(request.serviceRequested)}</td>
            <td>${esc(request.portalUsername)}</td>
            <td>${passwordCell}</td>
            <td>${esc(date)}</td>
            <td><span class="status-badge ${statusClass}">${esc(request.status)}</span></td>
            <td>
                <button data-action="toggle-portal" data-id="${esc(id)}" data-status="${esc(request.status)}" class="action-button">
                    ${request.status === 'Pending' ? 'Mark Handled' : 'Mark Pending'}
                </button>
            </td>
        `;
        return tr;
    }

    function createProjectRow(id, request) {
        const tr = document.createElement('tr');
        const date = new Date(request.timestamp).toLocaleString();
        const statusClass = request.status === 'Handled' ? 'status-handled' : 'status-pending';
        tr.innerHTML = `
            <td>${esc(request.fullName)}</td>
            <td>${esc(request.matricNumber)}</td>
            <td>${esc(request.phoneNumber)}</td>
            <td>${esc(request.department)}</td>
            <td>${esc(request.level)}</td>
            <td>${esc(request.serviceType)}</td>
            <td>${esc(request.topic)}</td>
            <td>${esc(request.deadline)}</td>
            <td>${esc(date)}</td>
            <td><span class="status-badge ${statusClass}">${esc(request.status)}</span></td>
            <td>
                <button data-action="toggle-status" data-table="project_requests" data-id="${esc(id)}" data-status="${esc(request.status)}" data-handled="Handled" class="action-button">
                    ${request.status === 'Pending' ? 'Mark Handled' : 'Mark Pending'}
                </button>
            </td>
        `;
        return tr;
    }

    function createAdRow(id, ad) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${esc(ad.title)}</td>
            <td>${esc(ad.placement)}</td>
            <td>${esc(new Date(ad.startDate).toLocaleString())}</td>
            <td>${esc(new Date(ad.endDate).toLocaleString())}</td>
            <td>
                <button data-action="delete-item" data-table="adverts" data-id="${esc(id)}" class="action-button delete">Delete</button>
            </td>
        `;
        return tr;
    }

    function createFeedbackRow(id, feedback) {
        const tr = document.createElement('tr');
        const date = new Date(feedback.timestamp).toLocaleString();
        const status = feedback.status || 'Pending';
        const statusClass = status === 'Reviewed' ? 'status-handled' : 'status-pending';
        tr.innerHTML = `
            <td>${esc(feedback.name || 'Anonymous')}</td>
            <td>${esc(feedback.phone || '-')}</td>
            <td>${esc(feedback.category || 'Feedback')}</td>
            <td>${esc(feedback.message)}</td>
            <td>${esc(date)}</td>
            <td><span class="status-badge ${statusClass}">${esc(status)}</span></td>
            <td>
                <button data-action="toggle-status" data-table="feedback_suggestions" data-id="${esc(id)}" data-status="${esc(status)}" data-handled="Reviewed" class="action-button">
                    ${status === 'Pending' ? 'Mark Reviewed' : 'Mark Pending'}
                </button>
            </td>
        `;
        return tr;
    }

    function createAdvertRequestRow(id, request) {
        const tr = document.createElement('tr');
        const statusClass = request.status === 'Reviewed' ? 'status-handled' : 'status-pending';
        tr.innerHTML = `
            <td>${esc(request.businessName)}</td>
            <td>${esc(request.contactPhone)}</td>
            <td>${esc(request.duration)} days</td>
            <td>${esc(request.placement)}</td>
            <td><span class="status-badge ${statusClass}">${esc(request.status)}</span></td>
            <td>
                <button data-action="toggle-status" data-table="advert_requests" data-id="${esc(id)}" data-status="${esc(request.status)}" data-handled="Reviewed" class="action-button">
                    ${request.status === 'Pending' ? 'Review' : 'Unreview'}
                </button>
            </td>
        `;
        return tr;
    }

    function createAnnouncementRow(id, ann) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${esc(ann.message)}</td>
            <td>${esc(new Date(ann.expiryDate).toLocaleString())}</td>
            <td>
                <button data-action="delete-item" data-table="announcements" data-id="${esc(id)}" class="action-button delete">Delete</button>
            </td>
        `;
        return tr;
    }

    function createPartnerRow(id, partner) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${attrUrl(partner.logoUrl)}" style="height: 30px; width: auto; max-width: 60px;"></td>
            <td>${esc(partner.name)}</td>
            <td><a href="${attrUrl(partner.contactUrl)}" target="_blank" rel="noopener noreferrer" class="download-link">Visit Link</a></td>
            <td>
                <button data-action="delete-item" data-table="partners" data-id="${esc(id)}" class="action-button delete">Delete</button>
            </td>
        `;
        return tr;
    }

    function createGadgetRow(id, p) {
        const tr = document.createElement('tr');
        const img = (p.images && p.images[0] && p.images[0].url) || '';
        tr.innerHTML = `
            <td><img src="${attrUrl(img)}" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px;"></td>
            <td>${esc(p.name)}</td>
            <td>${esc(p.category)}</td>
            <td>${esc(p.brand)}</td>
            <td>₦${num(p.price).toLocaleString()}</td>
            <td><button data-action="delete-item" data-table="gadget_products" data-id="${esc(id)}" class="action-button delete">Delete</button></td>
        `;
        return tr;
    }

    function createHousingRow(id, l) {
        const tr = document.createElement('tr');
        const img = (l.images && l.images[0] && l.images[0].url) || '';
        tr.innerHTML = `
            <td><img src="${attrUrl(img)}" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px;"></td>
            <td>${esc(l.name)}</td>
            <td>${esc(l.type)}</td>
            <td>${esc(l.location)}</td>
            <td>₦${num(l.price).toLocaleString()} ${esc(l.pricePeriod || '')}</td>
            <td><button data-action="delete-item" data-table="housing_listings" data-id="${esc(id)}" class="action-button delete">Delete</button></td>
        `;
        return tr;
    }

    // --- Form Handlers ---

    const newAdForm = document.getElementById('new-ad-form');
    const adUploadButton = document.getElementById('ad-upload-button');
    const adUploadFeedback = document.getElementById('ad-upload-feedback');
    let adImageUrl = null;
    let adImageId = null;

    if (adUploadButton) {
        const adFileInput = document.createElement('input');
        adFileInput.type = 'file';
        adFileInput.accept = 'image/*';
        adFileInput.style.display = 'none';
        document.body.appendChild(adFileInput);

        adUploadButton.addEventListener('click', () => adFileInput.click());

        adFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                adUploadButton.disabled = true;
                adUploadButton.textContent = 'Uploading...';
                const result = await window.storageService.uploadFile(file);
                adImageUrl = result.viewURL;
                adImageId = result.fileId;
                adUploadFeedback.innerHTML = `
                    <div class="upload-success-badge">
                        <img src="${attrUrl(result.viewURL)}" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                        <span>✅ Image attached: <strong>${esc(result.originalName)}</strong></span>
                    </div>
                `;
                adUploadFeedback.style.display = 'block';
                adUploadButton.disabled = false;
                adUploadButton.textContent = 'Change Image';
            } catch (err) {
                console.error("Admin Ad Upload Debug:", err);
                alert(`Upload failed: ${err.message || "Please check your console for details."}`);
                adUploadButton.disabled = false;
                adUploadButton.textContent = 'Upload Image';
            }
        });
    }

    if (newAdForm) {
        newAdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!adImageUrl) { alert("Please upload an image for the advert."); return; }

            const startDate = new Date(document.getElementById('ad-start').value).toISOString();
            const endDate = new Date(document.getElementById('ad-end').value).toISOString();
            const placement = document.getElementById('ad-place').value;

            const adData = {
                title: document.getElementById('ad-title').value,
                description: document.getElementById('ad-desc-admin').value,
                imageUrl: adImageUrl,
                imageId: adImageId,
                linkUrl: document.getElementById('ad-link').value || '#',
                startDate, endDate, placement,
                timestamp: new Date().toISOString()
            };
            try {
                const { error } = await sb.from('adverts').insert({
                    placement, start_date: startDate, end_date: endDate, data: adData
                });
                if (error) throw error;
                alert("Advert saved successfully!");
                newAdForm.reset();
                adImageUrl = null; adImageId = null;
                if (adUploadFeedback) adUploadFeedback.style.display = 'none';
                if (adUploadButton) adUploadButton.textContent = 'Upload Image';
                document.getElementById('new-ad-form-container').style.display = 'none';
                document.getElementById('toggle-new-ad-form').textContent = 'Create New Advert';
            } catch (err) {
                console.error(err);
                alert("Error saving advert.");
            }
        });
    }

    const newAnnForm = document.getElementById('new-ann-form');
    const annUploadButton = document.getElementById('ann-upload-button');
    const annUploadFeedback = document.getElementById('ann-upload-feedback');
    let annAttachment = null;

    if (annUploadButton) {
        const annFileInput = document.createElement('input');
        annFileInput.type = 'file';
        annFileInput.accept = 'image/*,.pdf,.doc,.docx';
        annFileInput.style.display = 'none';
        document.body.appendChild(annFileInput);

        annUploadButton.addEventListener('click', () => annFileInput.click());

        annFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                annUploadButton.disabled = true;
                annUploadButton.textContent = 'Uploading...';
                const result = await window.storageService.uploadFile(file);
                annAttachment = {
                    url: result.viewURL,
                    fileId: result.fileId,
                    type: file.type.startsWith('image/') ? 'image' : 'raw',
                    filename: result.originalName
                };
                const previewIcon = annAttachment.type === 'image' ? '🖼️' : '📄';
                annUploadFeedback.innerHTML = `
                    <div class="upload-success-badge">
                        <span>${previewIcon} ✅ Attached: <strong>${esc(annAttachment.filename)}</strong></span>
                    </div>
                `;
                annUploadFeedback.style.display = 'block';
                annUploadButton.disabled = false;
                annUploadButton.textContent = 'Change Attachment';
            } catch (err) {
                console.error("Admin Ann Upload Debug:", err);
                alert(`Upload failed: ${err.message || "Please check your console for details."}`);
                annUploadButton.disabled = false;
                annUploadButton.textContent = 'Upload Image/File';
            }
        });
    }

    if (newAnnForm) {
        newAnnForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const expiryDate = new Date(document.getElementById('ann-expiry').value).toISOString();
            const annData = {
                message: document.getElementById('ann-msg').value,
                link: document.getElementById('ann-link').value,
                attachment: annAttachment,
                expiryDate,
                timestamp: new Date().toISOString()
            };
            try {
                const { error } = await sb.from('announcements').insert({ expiry_date: expiryDate, data: annData });
                if (error) throw error;
                alert("Announcement posted!");
                newAnnForm.reset();
                annAttachment = null;
                if (annUploadFeedback) annUploadFeedback.style.display = 'none';
                if (annUploadButton) annUploadButton.textContent = 'Upload Image/File';
                document.getElementById('new-ann-form-container').style.display = 'none';
                document.getElementById('toggle-new-ann-form').textContent = 'New Announcement';
            } catch (err) {
                console.error(err);
                alert("Error posting announcement.");
            }
        });
    }

    const newPartnerForm = document.getElementById('new-partner-form');
    if (newPartnerForm) {
        newPartnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('partner-name').value;
            const partnerData = {
                name,
                logoUrl: document.getElementById('partner-logo').value,
                contactUrl: document.getElementById('partner-link').value,
                description: document.getElementById('partner-desc').value
            };
            try {
                const { error } = await sb.from('partners').insert({ name, data: partnerData });
                if (error) throw error;
                alert("Partner added!");
                newPartnerForm.reset();
                document.getElementById('new-partner-form-container').style.display = 'none';
                document.getElementById('toggle-new-partner-form').textContent = 'Add Partner';
            } catch (err) {
                console.error(err);
                alert("Error adding partner.");
            }
        });
    }

    const newGadgetForm = document.getElementById('new-gadget-form');
    const gadgetUploadButton = document.getElementById('gadget-upload-button');
    const gadgetUploadFeedback = document.getElementById('gadget-upload-feedback');
    let gadgetImageUrl = null;
    let gadgetImageId = null;

    if (gadgetUploadButton) {
        const gadgetFileInput = document.createElement('input');
        gadgetFileInput.type = 'file';
        gadgetFileInput.accept = 'image/*';
        gadgetFileInput.style.display = 'none';
        document.body.appendChild(gadgetFileInput);

        gadgetUploadButton.addEventListener('click', () => gadgetFileInput.click());

        gadgetFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                gadgetUploadButton.disabled = true;
                gadgetUploadButton.textContent = 'Uploading...';
                const result = await window.storageService.uploadFile(file);
                gadgetImageUrl = result.viewURL;
                gadgetImageId = result.fileId;
                gadgetUploadFeedback.innerHTML = `<div class="upload-success-badge">✅ Image attached: <strong>${esc(result.originalName)}</strong></div>`;
                gadgetUploadFeedback.style.display = 'block';
                gadgetUploadButton.disabled = false;
                gadgetUploadButton.textContent = 'Change Image';
            } catch (err) {
                alert(`Upload failed: ${err.message}`);
                gadgetUploadButton.disabled = false;
                gadgetUploadButton.textContent = 'Upload Image';
            }
        });
    }

    if (newGadgetForm) {
        newGadgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!gadgetImageUrl) { alert("Please upload a product image."); return; }

            const category = document.getElementById('gadget-category').value;
            const gadgetData = {
                name: document.getElementById('gadget-name').value,
                brand: document.getElementById('gadget-brand').value,
                price: Number(document.getElementById('gadget-price').value),
                oldPrice: Number(document.getElementById('gadget-old-price').value) || null,
                description: document.getElementById('gadget-desc').value,
                images: [{ url: gadgetImageUrl, fileId: gadgetImageId }]
            };
            try {
                const { error } = await sb.from('gadget_products').insert({ category, data: gadgetData });
                if (error) throw error;
                alert("Product saved!");
                newGadgetForm.reset();
                gadgetImageUrl = null;
                gadgetImageId = null;
                if (gadgetUploadFeedback) gadgetUploadFeedback.style.display = 'none';
                if (gadgetUploadButton) gadgetUploadButton.textContent = 'Upload Image';
                document.getElementById('new-gadget-form-container').style.display = 'none';
                document.getElementById('toggle-new-gadget-form').textContent = 'Add Product';
            } catch (err) {
                console.error(err);
                alert("Error saving product.");
            }
        });
    }

    const newHousingForm = document.getElementById('new-housing-form');
    const housingUploadButton = document.getElementById('housing-upload-button');
    const housingUploadFeedback = document.getElementById('housing-upload-feedback');
    let housingImageUrl = null;
    let housingImageId = null;

    if (housingUploadButton) {
        const housingFileInput = document.createElement('input');
        housingFileInput.type = 'file';
        housingFileInput.accept = 'image/*';
        housingFileInput.style.display = 'none';
        document.body.appendChild(housingFileInput);

        housingUploadButton.addEventListener('click', () => housingFileInput.click());

        housingFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                housingUploadButton.disabled = true;
                housingUploadButton.textContent = 'Uploading...';
                const result = await window.storageService.uploadFile(file);
                housingImageUrl = result.viewURL;
                housingImageId = result.fileId;
                housingUploadFeedback.innerHTML = `<div class="upload-success-badge">✅ Image attached: <strong>${esc(result.originalName)}</strong></div>`;
                housingUploadFeedback.style.display = 'block';
                housingUploadButton.disabled = false;
                housingUploadButton.textContent = 'Change Image';
            } catch (err) {
                alert(`Upload failed: ${err.message}`);
                housingUploadButton.disabled = false;
                housingUploadButton.textContent = 'Upload Image';
            }
        });
    }

    if (newHousingForm) {
        newHousingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!housingImageUrl) { alert("Please upload a listing photo."); return; }

            const type = document.getElementById('housing-type').value;
            const pricePeriod = document.getElementById('housing-period').value;
            const housingData = {
                name: document.getElementById('housing-name').value,
                location: document.getElementById('housing-location').value,
                price: Number(document.getElementById('housing-price').value),
                description: document.getElementById('housing-desc').value,
                images: [{ url: housingImageUrl, fileId: housingImageId }]
            };
            try {
                const { error } = await sb.from('housing_listings').insert({ type, price_period: pricePeriod, data: housingData });
                if (error) throw error;
                alert("Listing saved!");
                newHousingForm.reset();
                housingImageUrl = null;
                housingImageId = null;
                if (housingUploadFeedback) housingUploadFeedback.style.display = 'none';
                if (housingUploadButton) housingUploadButton.textContent = 'Upload Image';
                document.getElementById('new-housing-form-container').style.display = 'none';
                document.getElementById('toggle-new-housing-form').textContent = 'Add Listing';
            } catch (err) {
                console.error(err);
                alert("Error saving listing.");
            }
        });
    }

    // --- Global Action Functions ---

    window.togglePrintReady = async (id, currentStatus, studentName, phoneNumber) => {
        const newStatus = currentStatus === 'Ready' ? 'Paid' : 'Ready';
        try {
            const { error } = await sb.from('orders').update({ status: newStatus }).eq('id', id);
            if (error) throw error;

            if (newStatus === 'Ready') {
                const message = `Hello ${studentName}! Your print job is ready for collection at AfriNet Hub! 🚀`;
                const cleanPhone = String(phoneNumber || '').replace(/\D/g, '');
                const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank', 'noopener');
            }
        } catch (error) {
            console.error("Error updating order status: ", error);
        }
    };

    window.markAsCollected = async (id) => {
        try {
            const { error } = await sb.from('orders').update({ status: 'Collected' }).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Error marking as collected: ", error);
        }
    };

    window.deleteOrder = async (id, fileIdsEncoded, receiptId) => {
        if (confirm("Permanently delete this order and its files? This cannot be undone.")) {
            try {
                try {
                    const fileIds = JSON.parse(decodeURIComponent(fileIdsEncoded || '%5B%5D'));
                    if (Array.isArray(fileIds)) {
                        for (const fid of fileIds) {
                            if (fid && fid !== 'undefined') await window.storageService.deleteFile(fid);
                        }
                    }
                } catch (e) {
                    if (fileIdsEncoded && fileIdsEncoded !== 'undefined') await window.storageService.deleteFile(fileIdsEncoded);
                }
                if (receiptId && receiptId !== 'undefined') await window.storageService.deleteFile(receiptId);

                const { error } = await sb.from('orders').delete().eq('id', id);
                if (error) throw error;

                alert("Order and associated files deleted successfully!");
            } catch (error) {
                console.error("Error during smart deletion:", error);
                alert("Failed to delete order fully. Check console.");
            }
        }
    };

    window.toggleOrderStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Pending' ? 'Printed' : 'Pending';
        try {
            const { error } = await sb.from('orders').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating order status: ", error);
        }
    };

    window.togglePortalStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Pending' ? 'Handled' : 'Pending';
        try {
            const { error } = await sb.from('portal_requests').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating portal status: ", error);
        }
    };

    window.toggleStatus = async (table, id, currentStatus, handledVal) => {
        const newStatus = currentStatus === 'Pending' ? handledVal : 'Pending';
        try {
            const { error } = await sb.from(table).update({ status: newStatus }).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating status: ", error);
        }
    };

    window.deleteItem = async (table, id) => {
        if (confirm("Are you sure you want to delete this item? This cannot be undone.")) {
            try {
                const { data: row, error: fetchErr } = await sb.from(table).select('data').eq('id', id).single();
                if (fetchErr) throw fetchErr;

                if (table === 'adverts' && row.data.imageId) {
                    await window.storageService.deleteFile(row.data.imageId);
                }
                if (table === 'announcements' && row.data.attachment && row.data.attachment.fileId) {
                    await window.storageService.deleteFile(row.data.attachment.fileId);
                }
                if ((table === 'gadget_products' || table === 'housing_listings') && row.data.images && row.data.images[0] && row.data.images[0].fileId) {
                    await window.storageService.deleteFile(row.data.images[0].fileId);
                }

                const { error } = await sb.from(table).delete().eq('id', id);
                if (error) throw error;
                alert("Item deleted successfully.");
            } catch (error) {
                console.error("Error deleting item: ", error);
                alert("Error deleting item. Please check your permissions.");
            }
        }
    };

    // --- One click handler for every table button (replaces inline onclick) ---
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const d = btn.dataset;
        switch (d.action) {
            case 'toggle-print-ready': window.togglePrintReady(d.id, d.status, d.name, d.phone); break;
            case 'mark-collected':     window.markAsCollected(d.id); break;
            case 'delete-order':       window.deleteOrder(d.id, d.fileIds, d.receiptId); break;
            case 'toggle-portal':      window.togglePortalStatus(d.id, d.status); break;
            case 'toggle-status':      window.toggleStatus(d.table, d.id, d.status, d.handled); break;
            case 'delete-item':        window.deleteItem(d.table, d.id); break;
        }
    });
}