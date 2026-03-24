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
    if (window.db && window.firebaseMethods && window.firebaseMethods.onSnapshot) {
        clearInterval(checkDashboardDeps);
        initDashboard();
    }
}, 100);

function initDashboard() {
    console.log("Initializing Admin Dashboard Logic...");

    // Alias firebase methods for cleaner code
    const { collection, orderBy, onSnapshot, query, doc, updateDoc, deleteDoc, addDoc } = window.firebaseMethods;

    // --- Real-time Listeners ---

    // Orders Listener
    onSnapshot(query(collection(window.db, "orders"), orderBy("timestamp", "desc")), (snapshot) => {
        const ordersBody = document.getElementById('orders-body');
        if (ordersBody) {
            ordersBody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const order = docSnap.data();
                const row = createOrderRow(docSnap.id, order);
                ordersBody.appendChild(row);
            });
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
        const statusClass = order.status === 'Printed' ? 'status-printed' : 'status-pending';

        tr.innerHTML = `
            <td>${id.substring(0, 8)}...</td>
            <td>${order.studentName}</td>
            <td>${order.phoneNumber}</td>
            <td>${order.printType}</td>
            <td>${order.copies}</td>
            <td>₦${(order.totalPrice || 0).toFixed(2)}</td>
            <td><a href="${order.fileUrl}" target="_blank" class="download-link">View File</a></td>
            <td>${date}</td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td>
                <button onclick="toggleOrderStatus('${id}', '${order.status}')" class="action-button">
                    ${order.status === 'Pending' ? 'Mark Printed' : 'Mark Pending'}
                </button>
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

    if (adUploadButton) {
        adUploadButton.addEventListener('click', () => {
            window.openCloudinaryWidget().then(result => {
                adImageUrl = result.secure_url;
                adUploadFeedback.innerHTML = `
                    <div class="upload-success-badge">
                        <img src="${result.thumbnail_url}" style="height: 40px; width: 40px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                        <span>✅ Image attached: <strong>${result.original_filename}</strong></span>
                    </div>
                `;
                adUploadFeedback.style.display = 'block';
                adUploadButton.textContent = 'Change Image';
            }).catch(err => {
                console.error(err);
                alert("Upload failed.");
            });
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
        annUploadButton.addEventListener('click', () => {
            window.openCloudinaryWidget().then(result => {
                annAttachment = {
                    url: result.secure_url,
                    type: result.resource_type, // 'image' or 'raw'
                    filename: result.original_filename
                };
                
                const previewIcon = annAttachment.type === 'image' ? '🖼️' : '📄';
                annUploadFeedback.innerHTML = `
                    <div class="upload-success-badge">
                        <span>${previewIcon} ✅ Attached: <strong>${annAttachment.filename}</strong></span>
                    </div>
                `;
                annUploadFeedback.style.display = 'block';
                annUploadButton.textContent = 'Change Attachment';
            }).catch(err => {
                console.error(err);
                alert("Upload failed.");
            });
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
                await deleteDoc(docRef);
                alert("Item deleted successfully.");
            } catch (error) {
                console.error("Error deleting item: ", error);
                alert("Error deleting item. Please check your permissions.");
            }
        }
    };
}
