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

    // Fetch existing Vendor IDs for validation
    let vendorsData = [];

    fetch('/vendors-list')
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
                vendorIDInput.style.borderColor = 'red';
            } else {
                vendorIDError.textContent = '';
                vendorIDInput.style.borderColor = '';
            }
        });
    }

    // Performance Form Validation
    const performanceForm = document.getElementById('performanceForm');
    if (performanceForm) {
        const vendorIDInput = document.getElementById('VendorID');
        const vendorIDError = document.createElement('div');
        vendorIDError.className = 'error-message';
        vendorIDInput.insertAdjacentElement('afterend', vendorIDError);

        performanceForm.addEventListener('submit', (e) => {
            const vendorID = vendorIDInput.value.trim();
            if (!vendorsData.includes(vendorID)) {
                e.preventDefault();
                vendorIDError.textContent = 'Vendor ID does not exist. Please enter a valid Vendor ID.';
                vendorIDInput.style.borderColor = 'red';
            } else {
                vendorIDError.textContent = '';
                vendorIDInput.style.borderColor = '';
            }
        });
    }
});


