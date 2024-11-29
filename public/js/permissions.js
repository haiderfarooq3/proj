document.addEventListener('DOMContentLoaded', () => {
    const permissions = [
        { id: 1, name: "View Vendors", endpoint: "/vendors", method: "GET" },
        { id: 2, name: "Manage Vendors", endpoint: "/manage-vendors", method: "POST" },
        { id: 3, name: "View Contracts", endpoint: "/contracts", method: "GET" },
        { id: 4, name: "Manage Contracts", endpoint: "/manage-contracts", method: "POST" },
        { id: 5, name: "Create Purchase Orders", endpoint: "/create-purchase-orders", method: "POST" },
        { id: 6, name: "Approve Purchase Orders", endpoint: "/approve-purchase-orders", method: "POST" },
        { id: 7, name: "View Budgets", endpoint: "/budgets", method: "GET" },
        { id: 8, name: "Adjust Budgets", endpoint: "/adjust-budgets", method: "POST" },
        { id: 9, name: "View Notifications", endpoint: "/notifications", method: "GET" },
        { id: 10, name: "Manage Tasks", endpoint: "/manage-tasks", method: "POST" },
        { id: 11, name: "View Reports", endpoint: "/reports", method: "GET" },
    ];

    const container = document.getElementById('permissions-sections');
    const outputContainer = document.getElementById('output-section'); // For displaying results

    // Dynamically create sections for each permission
    permissions.forEach(permission => {
        const section = document.createElement('div');
        section.classList.add('permission-section');
        section.innerHTML = `
            <h3>${permission.name}</h3>
            <button onclick="executePermission('${permission.endpoint}', '${permission.method}')">
                Execute
            </button>
        `;
        container.appendChild(section);
    });
});

// Function to execute permissions via API and display results
function executePermission(endpoint, method) {
    const outputContainer = document.getElementById('output-section'); // For displaying results
    outputContainer.innerHTML = `<p>Loading...</p>`; // Show loading message

    fetch(endpoint, { method })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`${endpoint} Response:`, data);
            outputContainer.innerHTML = formatData(data, endpoint); // Format and display data
        })
        .catch(err => {
            console.error(`Error on ${endpoint}:`, err);
            outputContainer.innerHTML = `<p class="error">Error: ${err.message}</p>`;
        });
}

// Function to format data for display
function formatData(data, endpoint) {
    if (Array.isArray(data)) {
        // Display array data (e.g., tables for /vendors, /contracts, etc.)
        let table = `<h4>Results for ${endpoint}:</h4>`;
        table += `<table border="1" style="width: 100%; border-collapse: collapse;">`;
        table += `<tr>${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}</tr>`;
        data.forEach(row => {
            table += `<tr>${Object.values(row).map(value => `<td>${value || 'N/A'}</td>`).join('')}</tr>`;
        });
        table += `</table>`;
        return table;
    } else if (typeof data === 'object') {
        // Display object data (e.g., for POST actions)
        return `<h4>Results for ${endpoint}:</h4><pre>${JSON.stringify(data, null, 2)}</pre>`;
    } else {
        // Display simple data
        return `<h4>Results for ${endpoint}:</h4><p>${data}</p>`;
    }
}
