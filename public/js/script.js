// public/js/script.js

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

    // Fetch vendor directory and populate the table
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

    // Evaluate Performance Form Validation and Autocomplete
    const performanceForm = document.getElementById('performanceForm');
    const performanceErrors = document.getElementById('performanceErrors');

    if (performanceForm) {
        let vendorsData = [];

        // Fetch vendors for autocomplete
        fetch('/vendors-list')
            .then(response => response.json())
            .then(data => {
                vendorsData = data;
            })
            .catch(err => console.error('Error fetching vendors for autocomplete:', err));

        const vendorIDInput = document.getElementById('VendorID');
        const vendorSuggestions = document.getElementById('vendorSuggestions');

        vendorIDInput.addEventListener('input', () => {
            const inputValue = vendorIDInput.value.toLowerCase();
            vendorSuggestions.innerHTML = '';

            if (inputValue.length > 0) {
                const filteredVendors = vendorsData.filter(vendor =>
                    vendor.VendorID.toString().startsWith(inputValue) ||
                    vendor.Name.toLowerCase().includes(inputValue)
                );

                if (filteredVendors.length > 0) {
                    const suggestionsList = document.createElement('div');
                    suggestionsList.classList.add('suggestions-list');

                    filteredVendors.forEach(vendor => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.textContent = `${vendor.VendorID} - ${vendor.Name}`;
                        suggestionItem.addEventListener('click', () => {
                            vendorIDInput.value = vendor.VendorID;
                            vendorSuggestions.innerHTML = '';
                        });
                        suggestionsList.appendChild(suggestionItem);
                    });

                    vendorSuggestions.appendChild(suggestionsList);
                }
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!vendorSuggestions.contains(e.target) && e.target !== vendorIDInput) {
                vendorSuggestions.innerHTML = '';
            }
        });

        performanceForm.addEventListener('submit', (e) => {
            performanceErrors.innerHTML = ''; // Clear previous errors
            let valid = true;

            // Validate Vendor ID
            const vendorIDValue = vendorIDInput.value.trim();

            if (!vendorIDValue || isNaN(vendorIDValue)) {
                valid = false;
                vendorIDInput.style.borderColor = 'red';
                performanceErrors.innerHTML += `<p>Valid Vendor ID is required.</p>`;
            } else {
                vendorIDInput.style.borderColor = '';
            }

            // Validate Ratings (Service Quality, Timeliness, Pricing)
            const ratingFields = ['ServiceQuality', 'Timeliness', 'Pricing'];
            ratingFields.forEach((field) => {
                const input = document.getElementById(field);
                const value = parseFloat(input.value);
                if (isNaN(value) || value < 0 || value > 5) {
                    valid = false;
                    input.style.borderColor = 'red';
                    performanceErrors.innerHTML += `<p>${field.replace(/([A-Z])/g, ' $1')} must be between 0 and 5.</p>`;
                } else {
                    input.style.borderColor = '';
                }
            });

            // Prevent form submission if invalid
            if (!valid) {
                e.preventDefault();
                alert('Please fix the highlighted errors and try again.');
            }
        });
    }
});
