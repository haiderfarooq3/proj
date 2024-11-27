-- Create a new database
CREATE DATABASE CorporateVendorManagement;

-- Use the newly created database
USE CorporateVendorManagement;

-- Create Department table for reference
CREATE TABLE Department (
    DepartmentID INT AUTO_INCREMENT PRIMARY KEY,
    DepartmentName VARCHAR(255) NOT NULL
);

-- Create Vendor table
CREATE TABLE Vendor (
    VendorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    ServiceCategory VARCHAR(100),
    ContactInfo TEXT NOT NULL,
    ComplianceCertifications TEXT,
    PerformanceRating DECIMAL(3, 2) DEFAULT 0
);

-- Create Contract table
CREATE TABLE Contract (
    ContractID INT AUTO_INCREMENT PRIMARY KEY,
    VendorID INT NOT NULL,
    StartDate DATE,
    EndDate DATE,
    Terms TEXT,
    Status ENUM('Active', 'Pending Renewal', 'Expired') DEFAULT 'Pending Renewal',
    RenewalNotification BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Create Budget table
CREATE TABLE Budget (
    BudgetID INT AUTO_INCREMENT PRIMARY KEY,
    DepartmentID INT NOT NULL,
    AllocatedAmount DECIMAL(10, 2) NOT NULL,
    SpentAmount DECIMAL(10, 2) DEFAULT 0,
    RemainingAmount DECIMAL(10, 2) GENERATED ALWAYS AS (AllocatedAmount - SpentAmount) STORED,
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)
);

-- Create PurchaseOrder table
CREATE TABLE PurchaseOrder (
    POID INT AUTO_INCREMENT PRIMARY KEY,
    VendorID INT NOT NULL,
    BudgetID INT NOT NULL,
    Items TEXT NOT NULL,
    Quantity INT CHECK (Quantity > 0),
    TotalCost DECIMAL(10, 2) NOT NULL,
    Status ENUM('Pending', 'Approved', 'Fulfilled') DEFAULT 'Pending',
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID),
    FOREIGN KEY (BudgetID) REFERENCES Budget(BudgetID)
);

-- Create UserRoles table
CREATE TABLE UserRoles (
    RoleID INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) UNIQUE NOT NULL
);

-- Create PerformanceEvaluation table
CREATE TABLE PerformanceEvaluation (
    EvaluationID INT AUTO_INCREMENT PRIMARY KEY,
    VendorID INT NOT NULL,
    QualityRating DECIMAL(3, 2) CHECK (QualityRating BETWEEN 0 AND 5),
    TimelinessRating DECIMAL(3, 2) CHECK (TimelinessRating BETWEEN 0 AND 5),
    ComplianceRating DECIMAL(3, 2) CHECK (ComplianceRating BETWEEN 0 AND 5),
    Comments TEXT,
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Insert sample data into Department
INSERT INTO Department (DepartmentName) VALUES
('Procurement'),
('Finance'),
('Operations');

-- Insert sample data into UserRoles
INSERT INTO UserRoles (RoleName) VALUES
('Admin'),
('Procurement Manager'),
('Vendor Manager');

-- Insert sample data into Vendor
INSERT INTO Vendor (Name, ServiceCategory, ContactInfo, ComplianceCertifications, PerformanceRating) VALUES
('Vendor A', 'IT Services', 'contact@vendora.com', 'ISO 9001', 4.5),
('Vendor B', 'Office Supplies', 'contact@vendorb.com', 'ISO 14001', 3.8);

-- Insert sample data into Budget
INSERT INTO Budget (DepartmentID, AllocatedAmount) VALUES
(1, 10000),
(2, 5000),
(3, 8000);

-- Insert sample data into Contract
INSERT INTO Contract (VendorID, StartDate, EndDate, Terms, Status, RenewalNotification) VALUES
(1, '2024-01-01', '2025-01-01', 'Standard terms apply.', 'Active', TRUE),
(2, '2023-06-01', '2024-06-01', 'Custom terms apply.', 'Pending Renewal', FALSE);

-- Insert sample data into PurchaseOrder
INSERT INTO PurchaseOrder (VendorID, BudgetID, Items, Quantity, TotalCost, Status) VALUES
(1, 1, 'Laptops', 10, 5000, 'Approved'),
(2, 2, 'Office Chairs', 20, 2000, 'Pending');

-- Insert sample data into PerformanceEvaluation
INSERT INTO PerformanceEvaluation (VendorID, QualityRating, TimelinessRating, ComplianceRating, Comments) VALUES
(1, 4.5, 4.8, 4.9, 'Excellent service and timely delivery.'),
(2, 3.5, 3.8, 3.9, 'Satisfactory performance but needs improvement in delivery speed.');

-- Confirm that all tables have been created
SHOW TABLES;
