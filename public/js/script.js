document.addEventListener('DOMContentLoaded', () => {
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
    const adjustBudgetForm = document.getElementById('adjustBudgetForm');
    const budgetErrors = document.getElementById('budgetErrors');

    if (budgetTable) {
        fetch('/budgets')
            .then(response => response.json())
            .then(data => {
                data.forEach(budget => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${budget.BudgetID}</td>
                        <td>${budget.DepartmentID}</td>
                        <td>${budget.AllocatedAmount}</td>
                        <td>${budget.SpentAmount}</td>
                        <td>${(budget.AllocatedAmount - budget.SpentAmount).toFixed(2)}</td>
                    `;
                    budgetTable.appendChild(row);
                });
            })
            .catch(err => console.error('Error fetching budgets:', err));
    }

    if (adjustBudgetForm) {
        adjustBudgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            budgetErrors.innerHTML = ''; // Clear previous errors

            const BudgetID = document.getElementById('BudgetID').value;
            const AdjustmentAmount = document.getElementById('AdjustmentAmount').value;

            fetch('/adjust-budget', {
                method: 'POST',
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
        fetch('/vendors')
            .then(response => response.json())
            .then(data => {
                data.forEach(vendor => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${vendor.VendorID}</td>
                        <td>${vendor.Name}</td>
                        <td>${vendor.ServiceCategory}</td>
                        <td>${vendor.ContactInfo}</td>
                        <td>${vendor.ComplianceCertifications}</td>
                        <td>${vendor.AvgServiceQuality}</td>
                        <td>${vendor.AvgTimeliness}</td>
                        <td>${vendor.AvgPricing}</td>
                        <td>${vendor.PerformanceRating || 'N/A'}</td>
                    `;
                    vendorTable.appendChild(row);
                });
            })
            .catch(err => console.error('Error fetching vendors:', err));
    }

    // Fetch existing Vendor IDs for Validation
    let vendorsData = [];

    fetch('/vendors')
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

        contractForm.addEventListener('submit', (e) => {
            const vendorID = vendorIDInput.value.trim();
            if (!vendorsData.includes(vendorID)) {
                e.preventDefault();
                vendorIDError.textContent = 'Vendor ID does not exist. Please enter a valid Vendor ID.';
                vendorIDError.classList.add('error-message'); // Add the error-message class
                vendorIDInput.style.borderColor = 'red';
            } else {
                vendorIDError.textContent = '';
                vendorIDError.classList.remove('error-message'); // Remove the error-message class
                vendorIDInput.style.borderColor = '';
            }
        });
    }

    // Performance Form Validation and Logic
    const performanceForm = document.getElementById('performanceForm');
    if (performanceForm) {
        const performanceErrors = document.getElementById('performanceErrors');
        performanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performanceErrors.innerHTML = ''; // Clear previous errors

            const VendorID = document.getElementById('VendorID').value;
            const ServiceQuality = document.getElementById('ServiceQuality').value;
            const Timeliness = document.getElementById('Timeliness').value;
            const Pricing = document.getElementById('Pricing').value;
            const Feedback = document.getElementById('Feedback').value;

            // Validate if VendorID exists
            if (!vendorsData.includes(VendorID)) {
                performanceErrors.innerHTML += '<p>Invalid Vendor ID. Please enter a valid Vendor ID.</p>';
                return;
            }

            // Send the performance evaluation data to the backend
            fetch('/evaluate-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ VendorID, ServiceQuality, Timeliness, Pricing, Feedback })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                location.reload(); // Refresh to reflect changes
            })
            .catch(err => {
                console.error('Error evaluating performance:', err);
                performanceErrors.innerHTML = `<p>Error: ${err.message}</p>`;
            });
        });
    }

    // Vendor ID input event to show suggestions
    const vendorIDInput = document.getElementById('VendorID');
    const vendorSuggestions = document.getElementById('vendorSuggestions');

    vendorIDInput.addEventListener('input', () => {
        const query = vendorIDInput.value.trim();
        if (query.length > 0) {
            const suggestions = vendorsData.filter(vendorID => vendorID.includes(query));
            displaySuggestions(suggestions);
        } else {
            vendorSuggestions.innerHTML = ''; // Clear suggestions when input is empty
        }
    });

    // Display the filtered suggestions
    function displaySuggestions(suggestions) {
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
});
