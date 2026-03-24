/**
 * Admin Dashboard Management Logic
 * Handles real-time data display and management for:
 * - Print Orders
 * - Portal Requests
 * - Adverts (Scheduled & Inquiries)
 * - Announcements
 * - Partners
 */

// 1. Dependency Check & Initialization
const checkDashboardDeps = setInterval(() => {
    // Check if all needed window objects from database.js are ready
    if (window.db && window.firebaseMethods && window.firebaseMethods.onSnapshot && window.storageService) {
        clearInterval(checkDashboardDeps);
        initDashboard();
    }
}, 100);

function initDashboard() {
    console.log("Initializing Admin Dashboard Logic...");

    // Alias firebase methods for cleaner code
    const { collection, orderBy, onSnapshot, query, doc, updateDoc, deleteDoc, addDoc, where } = window.firebaseMethods;

    // --- Daily Accounting ---
    function updateDailySummary(orders) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyOrders = orders.filter(order => {
            if (!order.timestamp) return false;
            const orderDate = new Date(order.timestamp);
            return orderDate >= today && order.status === 'Collected';
        });

        const totalAmount = dailyOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        
        const amountEl = document.getElementById('daily-total-amount');
        const countEl = document.getElementById('daily-order-count');
        
        if (amountEl) amountEl.textContent = `₦${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (countEl) countEl.textContent = `${dailyOrders.length} orders collected today`;
    }

    // --- Real-time Listeners ---

    // Orders Listener
    onSnapshot(query(collection(window.db, "orders"), orderBy("timestamp", "desc")), (snapshot) => {
        const ordersBody = document.getElementById('orders-body');
        const allOrders = [];
        if (ordersBody) {
            ordersBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const order = docSnap.data();
                allOrders.push(order);
                const row = createOrderRow(docSnap.id, order);
                ordersBody.appendChild(row);
            });
            updateDailySummary(allOrders);
        }
    });

    // Portal Requests Listener
    onSnapshot(query(collection(window.db, "portalRequests"), orderBy("timestamp", "desc")), (snapshot) => {
        const portalBody = document.getElementById('portal-body');
        if (portalBody) {
            portalBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const request = docSnap.data();
                const row = createPortalRow(docSnap.id, request);
                portalBody.appendChild(row);
            });
        }
    });

    onSnapshot(query(collection(window.db, "feedbackSuggestions"), orderBy("timestamp", "desc")), (snapshot) => {
        const feedbackBody = document.getElementById('feedback-body');
        if (feedbackBody) {
            feedbackBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const feedback = docSnap.data();
                const row = createFeedbackRow(docSnap.id, feedback);
                feedbackBody.appendChild(row);
            });
        }
    });

    // Adverts Listener
    onSnapshot(query(collection(window.db, "adverts"), orderBy("startDate", "desc")), (snapshot) => {
        const advertsBody = document.getElementById('adverts-body');
        if (advertsBody) {
            advertsBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const ad = docSnap.data();
                const row = createAdRow(docSnap.id, ad);
                advertsBody.appendChild(row);
            });
        }
    });

    // Advert Requests Listener
    onSnapshot(query(collection(window.db, "advertRequests"), orderBy("timestamp", "desc")), (snapshot) => {
        const advertRequestsBody = document.getElementById('advert-requests-body');
        if (advertRequestsBody) {
            advertRequestsBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const request = docSnap.data();
                const row = createAdvertRequestRow(docSnap.id, request);
                advertRequestsBody.appendChild(row);
            });
        }
    });

    // Announcements Listener
    onSnapshot(query(collection(window.db, "announcements"), orderBy("expiryDate", "desc")), (snapshot) => {
        const announcementsBody = document.getElementById('announcements-body');
        if (announcementsBody) {
            announcementsBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const ann = docSnap.data();
                const row = createAnnouncementRow(docSnap.id, ann);
                announcementsBody.appendChild(row);
            });
        }
    });

    // Partners Listener
    onSnapshot(query(collection(window.db, "partners"), orderBy("name", "asc")), (snapshot) => {
        const partnersBody = document.getElementById('partners-body');
        if (partnersBody) {
            partnersBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const partner = docSnap.data();
                const row = createPartnerRow(docSnap.id, partner);
                partnersBody.appendChild(row);
            });
        }
    });

    // --- Row Creation Helpers ---

    function createOrderRow(id, order) {
        const tr = document.createElement('tr');
        const date = new Date(order.timestamp).toLocaleString();
        
        let statusClass = 'status-pending';
        if (order.status === 'Printed') statusClass = 'status-printed';
        if (order.status === 'Ready') statusClass = 'status-ready';
        if (order.status === 'Collected') statusClass = 'status-collected';
        if (order.status === 'Paid') statusClass = 'status-paid';

        const receiptLink = order.receiptUrl 
            ? `<a href="${order.receiptUrl}" target="_blank" class="download-link">Receipt</a>`
            : `<span style="opacity:0.5; font-size:0.8em;">No Receipt</span>`;

        tr.innerHTML = `
            <td>${id.substring(0, 8)}...</td>
            <td>${order.studentName}</td>
            <td>${order.phoneNumber}</td>
            <td>${order.printType}</td>
            <td>${order.pageCount} pgs / ${order.copies} cps</td>
            <td>₦${(order.totalPrice || 0).toFixed(2)}</td>
            <td><a href="${order.fileUrl}" target="_blank" class="download-link">Open File</a></td>
            <td>${receiptLink}</td>
            <td>${date}</td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td>
                <div class="action-group">
                    <button onclick="togglePrintReady('${id}', '${order.status}', '${order.studentName}', '${order.phoneNumber}')" class="action-button-small btn-ready">
                        ${order.status === 'Ready' ? 'Undo Ready' : 'Print Ready'}
                    </button>
                    <button onclick="markAsCollected('${id}')" class="action-button-small btn-collected" ${order.status === 'Collected' ? 'disabled' : ''}>
                        Collected
                    </button>
                    <button onclick="deleteOrder('${id}', '${order.fileId}', '${order.receiptId}')" class="action-button-small btn-delete">
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

        tr.innerHTML = `
            <td>${request.fullName}</td>
            <td>${request.matricNumber}</td>
            <td>${request.phoneNumber}</td>
            <td>${request.department}</td>
            <td>${request.level}</td>
            <td>${request.serviceRequested}</td>
            <td>${request.portalUsername}</td>
            <td>${date}</td>
            <td><span class="status-badge ${statusClass}">${request.status}</span></td>
            <td>
                <button onclick="togglePortalStatus('${id}', '${request.status}')" class="action-button">
                    ${request.status === 'Pending' ? 'Mark Handled' : 'Mark Pending'}
                </button>
            </td>
        `;
        return tr;
    }

    function createAdRow(id, ad) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ad.title}</td>
            <td>${ad.placement}</td>
            <td>${new Date(ad.startDate).toLocaleString()}</td>
            <td>${new Date(ad.endDate).toLocaleString()}</td>
            <td>
                <button onclick="deleteItem('adverts', '${id}')" class="action-button delete">Delete</button>
            </td>
        `;
        return tr;
    }

    function createFeedbackRow(id, feedback) {
        const tr = document.createElement('tr');
        const date = new Date(feedback.timestamp).toLocaleString();
        const statusClass = feedback.status === 'Reviewed' ? 'status-handled' : 'status-pending';
        tr.innerHTML = `
            <td>${feedback.name || 'Anonymous'}</td>
            <td>${feedback.phone || '-'}</td>
            <td>${feedback.category || 'Feedback'}</td>
            <td>${feedback.message}</td>
            <td>${date}</td>
            <td><span class="status-badge ${statusClass}">${feedback.status || 'Pending'}</span></td>
            <td>
                <button onclick="toggleStatus('feedbackSuggestions', '${id}', '${feedback.status || 'Pending'}', 'Reviewed')" class="action-button">
                    ${(feedback.status || 'Pending') === 'Pending' ? 'Mark Reviewed' : 'Mark Pending'}
                </button>
            </td>
        `;
        return tr;
    }

    function createAdvertRequestRow(id, request) {
        const tr = document.createElement('tr');
        const statusClass = request.status === 'Reviewed' ? 'status-handled' : 'status-pending';
        tr.innerHTML = `
            <td>${request.businessName}</td>
            <td>${request.contactPhone}</td>
            <td>${request.duration} days</td>
            <td>${request.placement}</td>
            <td><span class="status-badge ${statusClass}">${request.status}</span></td>
            <td>
                <button onclick="toggleStatus('advertRequests', '${id}', '${request.status}', 'Reviewed')" class="action-button">
                    ${request.status === 'Pending' ? 'Review' : 'Unreview'}
                </button>
            </td>
        `;
        return tr;
    }

    function createAnnouncementRow(id, ann) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ann.message}</td>
            <td>${new Date(ann.expiryDate).toLocaleString()}</td>
            <td>
                <button onclick="deleteItem('announcements', '${id}')" class="action-button delete">Delete</button>
            </td>
        `;
        return tr;
    }

    function createPartnerRow(id, partner) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${partner.logoUrl}" style="height: 30px; width: auto; max-width: 60px;"></td>
            <td>${partner.name}</td>
            <td><a href="${partner.contactUrl}" target="_blank" class="download-link">Visit Link</a></td>
            <td>
                <button onclick="deleteItem('partners', '${id}')" class="action-button delete">Delete</button>
            </td>
        `;
        return tr;
    }

    // --- Form Handlers ---

    // New Ad Form
    const newAdForm = document.getElementById('new-ad-form');
    const adUploadButton = document.getElementById('ad-upload-button');
    const adUploadFeedback = document.getElementById('ad-upload-feedback');
    let adImageUrl = null;
    let adImageId = null;

    if (adUploadButton) {
        // Add hidden file input
        const adFileInput = document.createElement('input');
        adFileInput.type = 'file';
        adFileInput.accept = 'image/*';
        adFileInput.style.display = 'none';
        document.body.appendChild(adFileInput);

        adUploadButton.addEventListener('click', () => {
            adFileInput.click();
        });

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
                        <img src="${result.viewURL}" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                        <span>✅ Image attached: <strong>${result.originalName}</strong></span>
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

            if (!adImageUrl) {
                alert("Please upload an image for the advert.");
                return;
            }

            const adData = {
                title: document.getElementById('ad-title').value,
                description: document.getElementById('ad-desc-admin').value,
                imageUrl: adImageUrl,
                imageId: adImageId,
                linkUrl: document.getElementById('ad-link').value || '#',
                startDate: new Date(document.getElementById('ad-start').value).toISOString(),
                endDate: new Date(document.getElementById('ad-end').value).toISOString(),
                placement: document.getElementById('ad-place').value,
                timestamp: new Date().toISOString()
            };
            try {
                await addDoc(collection(window.db, "adverts"), adData);
                alert("Advert saved successfully!");
                newAdForm.reset();
                adImageUrl = null;
                adImageId = null;
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

    // New Announcement Form
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

        annUploadButton.addEventListener('click', () => {
            annFileInput.click();
        });

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
                        <span>${previewIcon} ✅ Attached: <strong>${annAttachment.filename}</strong></span>
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
            const annData = {
                message: document.getElementById('ann-msg').value,
                link: document.getElementById('ann-link').value,
                attachment: annAttachment,
                expiryDate: new Date(document.getElementById('ann-expiry').value).toISOString(),
                timestamp: new Date().toISOString()
            };
            try {
                await addDoc(collection(window.db, "announcements"), annData);
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

    // New Partner Form
    const newPartnerForm = document.getElementById('new-partner-form');
    if (newPartnerForm) {
        newPartnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const partnerData = {
                name: document.getElementById('partner-name').value,
                logoUrl: document.getElementById('partner-logo').value,
                contactUrl: document.getElementById('partner-link').value,
                description: document.getElementById('partner-desc').value
            };
            try {
                await addDoc(collection(window.db, "partners"), partnerData);
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

    // --- Global Action Functions (Attached to window for HTML onclick access) ---

    window.togglePrintReady = async (id, currentStatus, studentName, phoneNumber) => {
        const newStatus = currentStatus === 'Ready' ? 'Paid' : 'Ready';
        try {
            const orderDoc = doc(window.db, "orders", id);
            await updateDoc(orderDoc, { status: newStatus });

            if (newStatus === 'Ready') {
                // Trigger WhatsApp Notification
                const message = `Hello ${studentName}! Your print job is ready for collection at Unilesh Print Hub! 🚀`;
                const cleanPhone = phoneNumber.replace(/\s+/g, '');
                const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                console.log("Notification triggered for order", id);
            }
        } catch (error) {
            console.error("Error updating order status: ", error);
        }
    };

    window.markAsCollected = async (id) => {
        try {
            const orderDoc = doc(window.db, "orders", id);
            await updateDoc(orderDoc, { status: 'Collected' });
        } catch (error) {
            console.error("Error marking as collected: ", error);
        }
    };

    window.deleteOrder = async (id, fileId, receiptId) => {
        if (confirm("Permanently delete this order and its files? This cannot be undone.")) {
            try {
                // 1. Delete from Appwrite Storage
                if (fileId && fileId !== 'undefined') await window.storageService.deleteFile(fileId);
                if (receiptId && receiptId !== 'undefined') await window.storageService.deleteFile(receiptId);

                // 2. Delete from Firestore
                const orderDoc = doc(window.db, "orders", id);
                await deleteDoc(orderDoc);
                
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
            const orderDoc = doc(window.db, "orders", id);
            await updateDoc(orderDoc, { status: newStatus });
        } catch (error) {
            console.error("Error updating order status: ", error);
        }
    };

    window.togglePortalStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Pending' ? 'Handled' : 'Pending';
        try {
            const portalDoc = doc(window.db, "portalRequests", id);
            await updateDoc(portalDoc, { status: newStatus });
        } catch (error) {
            console.error("Error updating portal status: ", error);
        }
    };

    window.toggleStatus = async (coll, id, currentStatus, handledVal) => {
        const newStatus = currentStatus === 'Pending' ? handledVal : 'Pending';
        try {
            const docRef = doc(window.db, coll, id);
            await updateDoc(docRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating status: ", error);
        }
    };

    window.deleteItem = async (coll, id) => {
        if (confirm("Are you sure you want to delete this item? This cannot be undone.")) {
            try {
                const docRef = doc(window.db, coll, id);
                const docSnap = await window.firebaseMethods.getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Smart Deletion for Adverts
                    if (coll === 'adverts' && data.imageId) {
                        await window.storageService.deleteFile(data.imageId);
                    }
                    // Smart Deletion for Announcements
                    if (coll === 'announcements' && data.attachment && data.attachment.fileId) {
                        await window.storageService.deleteFile(data.attachment.fileId);
                    }
                }

                await deleteDoc(docRef);
                alert("Item deleted successfully.");
            } catch (error) {
                console.error("Error deleting item: ", error);
                alert("Error deleting item. Please check your permissions.");
            }
        }
    };
}
