document.addEventListener('DOMContentLoaded', () => {
    // Get user role from localStorage
    const userRole = parseInt(localStorage.getItem('userRole'));
    
    // Handle navigation visibility based on role
    if (userRole) {
        const navLinks = document.querySelectorAll('.nav-link, .navbar-nav .nav-item');
        
        switch (userRole) {
            case 3: // Vendor
                // Show only register vendor
                navLinks.forEach(link => {
                    if (!link.getAttribute('href')?.includes('register-vendor')) {
                        link.style.display = 'none';
                    }
                });
                break;
                
            case 5: // Finance
                // Show only budget
                navLinks.forEach(link => {
                    if (!link.getAttribute('href')?.includes('budget')) {
                        link.style.display = 'none';
                    }
                });
                break;
                
            case 1: // Admin
            case 2: // Manager
            case 4: // Procurement
                // Show everything
                navLinks.forEach(link => {
                    link.style.display = 'block';
                });
                break;
        }
        
        // Restrict navigation for Vendor and Finance users
        if (userRole === 3) { // Vendor
            if (!window.location.pathname.includes('register-vendor.html')) {
                window.location.href = '/register-vendor.html';
            }
        } else if (userRole === 5) { // Finance
            if (!window.location.pathname.includes('budget.html')) {
                window.location.href = '/budget.html';
            }
        }
    }

    // Check user role and adjust UI from session
    fetch('/api/check-session')
    .then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
            const role = data.user.RoleID;
            const navItems = document.querySelectorAll('.nav-item');

            navItems.forEach(item => {
                const allowedRoles = item.dataset.roles.split(',').map(Number);
                if (!allowedRoles.includes(role)) {
                    item.style.display = 'none';
                }
            });

            // Hide irrelevant content based on role
            const restrictedSections = {
                2: ['vendor-registration', 'performance-evaluation'],
                3: ['budget-management'],
                4: ['vendor-directory', 'vendor-registration']
            };

            if (restrictedSections[role]) {
                document.querySelectorAll('section').forEach(section => {
                    if (restrictedSections[role].includes(section.id)) {
                        section.style.display = 'none';
                    }
                });
            }
        }
    })
    .catch(err => console.error('Error checking session:', err));

    // Vendor Registration Form Validation
    const vendorForm = document.getElementById('vendorForm');
    const vendorErrors = document.getElementById('vendorErrors');

    if (vendorForm) {
        vendorForm.addEventListener('submit', (e) => {
            vendorErrors.innerHTML = ''; // Clear previous errors
            let valid = true;

            // Validate Vendor Name
            const nameInput = document.getElementById('Name');
            const nameRegex = /^[a-zA-Z0-9\s]{1,50}$/;
            if (!nameRegex.test(nameInput.value)) {
                valid = false;
                nameInput.style.borderColor = 'red';
                vendorErrors.innerHTML += `<p>Vendor Name must be alphanumeric and up to 50 characters.</p>`;
            } else {
                nameInput.style.borderColor = '';
            }

            // Validate Service Category
            const serviceCategoryInput = document.getElementById('ServiceCategory');
            const serviceCategoryRegex = /^[a-zA-Z\s]{1,50}$/;
            if (!serviceCategoryRegex.test(serviceCategoryInput.value)) {
                valid = false;
                serviceCategoryInput.style.borderColor = 'red';
                vendorErrors.innerHTML += `<p>Service Category must contain only letters and up to 50 characters.</p>`;
            } else {
                serviceCategoryInput.style.borderColor = '';
            }

            // Validate Contact Info (Email)
            const contactInfoInput = document.getElementById('ContactInfo');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactInfoInput.value)) {
                valid = false;
                contactInfoInput.style.borderColor = 'red';
                vendorErrors.innerHTML += `<p>Contact Info must be a valid email address (e.g., xyz@email.com).</p>`;
            } else {
                contactInfoInput.style.borderColor = '';
            }

            // Validate Compliance Certifications
            const certificationsInput = document.getElementById('ComplianceCertifications');
            const certificationsRegex = /^ISO-\d{4}$/;
            if (!certificationsRegex.test(certificationsInput.value)) {
                valid = false;
                certificationsInput.style.borderColor = 'red';
                vendorErrors.innerHTML += `<p>Compliance Certifications must be in the format ISO-XXXX (e.g., ISO-9001).</p>`;
            } else {
                certificationsInput.style.borderColor = '';
            }

            // Prevent form submission if validation fails
            if (!valid) {
                e.preventDefault();
                alert('Invalid data detected. Please review and correct the highlighted fields.');
            }
        });
    }

    // Budget Management Logic
    const budgetTable = document.getElementById('budgetTable');
    if (budgetTable) {
        // Show loading state
        budgetTable.innerHTML = '<tr><td colspan="5">Loading budget data...</td></tr>';

        fetch('/api/budgets', {
            method: 'GET',
            credentials: 'include', // Ensure cookies are sent with the request
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(async response => {
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    window.location.href = '/login.html';
                    throw new Error('Session expired. Redirecting to login.');
                }
                throw new Error('Failed to fetch budget data');
            }
            const data = await response.json();
            return data;
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }

            budgetTable.innerHTML = '';
            data.forEach(budget => {
                const allocated = parseFloat(budget.AllocatedAmount) || 0;
                const spent = parseFloat(budget.SpentAmount) || 0;
                const remaining = allocated - spent;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${budget.BudgetID || 'N/A'}</td>
                    <td>${budget.DepartmentID || 'N/A'}</td>
                    <td>$${allocated.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>$${spent.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td>$${remaining.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                `;
                budgetTable.appendChild(row);
            });
        })
        .catch(err => {
            console.error('Error fetching budgets:', err);
            if (err.message.includes('Redirecting to login')) {
                return;
            }
            budgetTable.innerHTML = `
                <tr>
                    <td colspan="5" style="color: red; padding: 20px; text-align: center;">
                        Error loading budget data. Please try again later.<br>
                        <small>${err.message}</small><br>
                        <button onclick="window.location.reload()">Retry</button>
                    </td>
                </tr>`;
        });
    }

    // Adjust Budget Form Submission
    const adjustBudgetForm = document.getElementById('adjustBudgetForm');
    const budgetErrors = document.getElementById('budgetErrors');

    if (adjustBudgetForm) {
        adjustBudgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            budgetErrors.innerHTML = ''; // Clear previous errors

            const BudgetID = document.getElementById('BudgetID').value;
            const AdjustmentAmount = document.getElementById('AdjustmentAmount').value;

            fetch('/api/adjust-budget', { // Updated URL to include /api/
                method: 'POST',
                credentials: 'include', // Ensure cookies are sent with the request
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ BudgetID, AdjustmentAmount })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                location.reload(); // Refresh to reflect changes
            })
            .catch(err => {
                console.error('Error adjusting budget:', err);
                budgetErrors.innerHTML = `<p>Error: ${err.message}</p>`;
            });
        });
    }

    // Vendor Directory Logic
    const vendorTable = document.getElementById('vendorTable');

    if (vendorTable) {
        fetch('/api/vendors')
            .then(response => response.json())
            .then(data => {
                const tbody = vendorTable.querySelector('tbody');
                tbody.innerHTML = ''; // Clear existing content
                
                data.forEach(vendor => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${vendor.VendorID}</td>
                        <td>${vendor.Name || 'N/A'}</td>
                        <td>${vendor.ServiceCategory || 'N/A'}</td>
                        <td>${vendor.ContactInfo || 'N/A'}</td>
                        <td>${vendor.ComplianceCertifications || 'N/A'}</td>
                        <td>${vendor.AvgServiceQuality || 'N/A'}</td>
                        <td>${vendor.AvgTimeliness || 'N/A'}</td>
                        <td>${vendor.AvgPricing || 'N/A'}</td>
                        <td>${vendor.PerformanceRating || 'N/A'}</td>
                        <td>
                         <button class="delete-button" data-vendor-id="${vendor.VendorID}">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Add delete button handlers if admin
                if (userRole === 1) {
                    attachDeleteHandlers();
                }
            })
            .catch(err => {
                console.error('Error fetching vendors:', err);
                vendorTable.querySelector('tbody').innerHTML = '<tr><td colspan="10">Error loading vendor data</td></tr>';
            });
    }

    // Helper function for delete button handlers
    function attachDeleteHandlers() {
        const deleteButtons = document.querySelectorAll('.delete-button');
        const deleteModal = document.getElementById('deleteModal');
        const confirmDelete = document.getElementById('confirmDelete');
        const cancelDelete = document.getElementById('cancelDelete');
        const modalCloseButton = document.getElementById('closeDeleteModal');
        let vendorIDToDelete = null;
    
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                vendorIDToDelete = e.target.dataset.vendorId;
                deleteModal.style.display = 'block';
            });
        });
    
        confirmDelete.addEventListener('click', () => {
            if (vendorIDToDelete) {
                fetch('/api/delete-vendor', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vendorID: vendorIDToDelete })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(data.message);
                            location.reload(); // Reload the page to reflect changes
                        } else {
                            alert('Failed to delete vendor: ' + data.message);
                        }
                    })
                    .catch(err => {
                        console.error('Error deleting vendor:', err);
                        alert('An error occurred while deleting the vendor.');
                    })
                    .finally(() => {
                        deleteModal.style.display = 'none';
                    });
            }
        });
    
        cancelDelete.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    
        modalCloseButton.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    
        window.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                deleteModal.style.display = 'none';
            }
        });
    }
    

    // Fetch existing Vendor IDs for Validation
    let vendorsData = [];

    fetch('/api/vendors', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent with the request
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        vendorsData = data.map(vendor => vendor.VendorID.toString());
    })
    .catch(err => console.error('Error fetching vendor IDs:', err));

    // Contract Form Validation
    const contractForm = document.getElementById('contractForm');
    if (contractForm) {
        const vendorIDInput = document.getElementById('VendorID');
        const vendorIDError = document.createElement('div');
        vendorIDError.className = 'error-message';
        vendorIDInput.insertAdjacentElement('afterend', vendorIDError);

        vendorIDInput.addEventListener('input', () => {
            // Clear error when user starts typing
            vendorIDError.textContent = '';
            vendorIDInput.style.borderColor = '';
        });

        contractForm.addEventListener('submit', (e) => {
            const vendorID = vendorIDInput.value.trim();
            if (!vendorsData.includes(vendorID)) {
                e.preventDefault();
                vendorIDError.textContent = 'Vendor ID does not exist. Please enter a valid Vendor ID.';
                vendorIDInput.style.borderColor = 'red';
            }
        });
    }

    // Performance Form Validation and Logic
    const performanceForm = document.getElementById('performanceForm');
    if (performanceForm) {
        const vendorIDInput = document.getElementById('VendorID');
        const performanceErrors = document.getElementById('performanceErrors');

        vendorIDInput.addEventListener('input', () => {
            performanceErrors.innerHTML = '';
        });

        performanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performanceErrors.innerHTML = '';

            const vendorID = vendorIDInput.value.trim();
            if (!vendorsData.includes(vendorID)) {
                performanceErrors.innerHTML = '<p>Invalid Vendor ID. Please enter a valid Vendor ID.</p>';
                return;
            }

            const formData = {
                VendorID: vendorID,
                ServiceQuality: document.getElementById('ServiceQuality').value,
                Timeliness: document.getElementById('Timeliness').value,
                Pricing: document.getElementById('Pricing').value,
                Feedback: document.getElementById('Feedback').value
            };

            fetch('/api/evaluate-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                performanceForm.reset();
            })
            .catch(err => {
                console.error('Error:', err);
                performanceErrors.innerHTML = `<p>Error: ${err.message}</p>`;
            });
        });
    }

    // Vendor ID input event to show suggestions
    const vendorIDInput = document.getElementById('VendorID');
    const vendorSuggestions = document.getElementById('vendorSuggestions');

    if (vendorIDInput && vendorSuggestions) {
        vendorIDInput.addEventListener('input', () => {
            const query = vendorIDInput.value.trim();
            if (query.length > 0) {
                const suggestions = vendorsData.filter(vendorID => vendorID.includes(query));
                displaySuggestions(suggestions);
            } else {
                vendorSuggestions.innerHTML = ''; // Clear suggestions when input is empty
            }
        });
    }

    // Display the filtered suggestions
    function displaySuggestions(suggestions) {
        if (!vendorSuggestions) return;
        vendorSuggestions.innerHTML = ''; // Clear previous suggestions
        suggestions.forEach(vendorID => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.textContent = vendorID;
            suggestionDiv.onclick = () => {
                vendorIDInput.value = vendorID; // Auto-complete Vendor ID when clicked
                vendorSuggestions.innerHTML = ''; // Clear suggestions
            };
            vendorSuggestions.appendChild(suggestionDiv);
        });
    }

    // Example: Check if the user is logged in to adjust the UI
    fetch('/api/check-session', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent with the request
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.loggedIn) {
            // ...modify the UI for logged-in users...
        } else {
            // ...modify the UI for guests...
        }
    })
    .catch(err => console.error('Error checking session:', err));

    const navLinks = document.querySelectorAll('nav ul li');

    if (!userRole) {
        navLinks.forEach(link => {
            if (!link.querySelector('a').getAttribute('href').includes('login.html')) {
                link.style.display = 'none';
            }
        });
    } else {
        navLinks.forEach(link => {
            const href = link.querySelector('a').getAttribute('href');
            if ((userRole === 3 && !href.includes('register-vendor.html')) ||
                (userRole === 5 && !href.includes('budget.html'))) {
                link.style.display = 'none';
            }
        });
    }
});
