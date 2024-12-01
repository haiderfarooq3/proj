-- Step 1: Drop and Create Database
DROP DATABASE IF EXISTS CorporateVendorDB;
CREATE DATABASE CorporateVendorDB;
USE CorporateVendorDB;

-- Step 2: Create Role Table (For Role-Based Access Control)
CREATE TABLE Role (
    RoleID INT PRIMARY KEY AUTO_INCREMENT,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

-- Step 3: Create Permission Table (For Fine-Grained Permissions)
CREATE TABLE Permission (
    PermissionID INT PRIMARY KEY AUTO_INCREMENT,
    PermissionName VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE RolePermission (
    RoleID INT NOT NULL,
    PermissionID INT NOT NULL,
    PRIMARY KEY (RoleID, PermissionID),
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID),
    FOREIGN KEY (PermissionID) REFERENCES Permission(PermissionID)
);

-- Step 4: Create Vendor Table
CREATE TABLE Vendor (
    VendorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    ServiceCategory VARCHAR(100) NOT NULL,
    ContactInfo TEXT NOT NULL,
    ComplianceCertifications TEXT,
    PerformanceRating DECIMAL(3, 2) CHECK (PerformanceRating >= 0.00 AND PerformanceRating <= 5.00)
);

-- Step 5: Create Department Table WITHOUT foreign key constraint on ManagerID
CREATE TABLE Department (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
    DepartmentName VARCHAR(255) NOT NULL,
    ManagerID INT
    -- FOREIGN KEY (ManagerID) REFERENCES User(UserID) -- Will add this later
);

-- Add Unique Index to DepartmentName to resolve safe update mode error
ALTER TABLE Department
ADD UNIQUE INDEX idx_DepartmentName (DepartmentName);

-- Step 6: Create User Table WITHOUT foreign key constraint on DepartmentID
CREATE TABLE User (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    UserName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    DepartmentID INT,
    VendorID INT,
    RoleID INT NOT NULL,
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID),
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID),
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)
);


-- Step 7: Alter Department Table to add FOREIGN KEY constraint on ManagerID
ALTER TABLE Department
ADD CONSTRAINT FK_Department_Manager FOREIGN KEY (ManagerID) REFERENCES User(UserID);

-- Step 8: Alter User Table to add FOREIGN KEY constraint on DepartmentID
ALTER TABLE User
ADD CONSTRAINT FK_User_Department FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID);

-- Step 9: Create VendorPerformance Table
CREATE TABLE VendorPerformance (
    EvaluationID INT PRIMARY KEY AUTO_INCREMENT,
    VendorID INT NOT NULL,
    EvaluationDate DATE NOT NULL,
    ServiceQuality DECIMAL(5, 2) NOT NULL CHECK (ServiceQuality >= 0.00 AND ServiceQuality <= 5.00),
    Timeliness DECIMAL(5, 2) NOT NULL CHECK (Timeliness >= 0.00 AND Timeliness <= 5.00),
    Pricing DECIMAL(5, 2) NOT NULL CHECK (Pricing >= 0.00 AND Pricing <= 5.00),
    Feedback TEXT,
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID)
);

-- Step 10: Create Contract Table with Versioning
CREATE TABLE Contract (
    ContractID INT PRIMARY KEY AUTO_INCREMENT,
    VendorID INT NOT NULL,
    DepartmentID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Status VARCHAR(50) NOT NULL,
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID),
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)
);

CREATE TABLE ContractVersion (
    VersionID INT PRIMARY KEY AUTO_INCREMENT,
    ContractID INT NOT NULL,
    VersionNumber INT NOT NULL,
    ModifiedDate DATE NOT NULL,
    ModifiedBy INT NOT NULL,
    ContractContent TEXT NOT NULL,
    FOREIGN KEY (ContractID) REFERENCES Contract(ContractID),
    FOREIGN KEY (ModifiedBy) REFERENCES User(UserID)
);

CREATE TABLE ContractAnnotation (
    AnnotationID INT PRIMARY KEY AUTO_INCREMENT,
    ContractID INT NOT NULL,
    UserID INT NOT NULL,
    AnnotationDate DATE NOT NULL,
    AnnotationText TEXT NOT NULL,
    FOREIGN KEY (ContractID) REFERENCES Contract(ContractID),
    FOREIGN KEY (UserID) REFERENCES User(UserID)
);

-- Step 11: Create Notification Table
CREATE TABLE Notification (
    NotificationID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    NotificationDate DATE NOT NULL,
    Message TEXT NOT NULL,
    IsRead BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserID) REFERENCES User(UserID)
);

-- Step 12: Create Budget Table and BudgetAdjustment Table
CREATE TABLE Budget (
    BudgetID INT PRIMARY KEY AUTO_INCREMENT,
    DepartmentID INT NOT NULL,
    AllocatedAmount DECIMAL(15, 2) NOT NULL,
    SpentAmount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)
);

CREATE TABLE BudgetAdjustment (
    AdjustmentID INT PRIMARY KEY AUTO_INCREMENT,
    BudgetID INT NOT NULL,
    AdjustmentDate DATE NOT NULL,
    Amount DECIMAL(15, 2) NOT NULL,
    Reason TEXT,
    FOREIGN KEY (BudgetID) REFERENCES Budget(BudgetID)
);

-- Step 13: Create Budget View for RemainingAmount
CREATE VIEW BudgetView AS
SELECT BudgetID, DepartmentID, AllocatedAmount, SpentAmount,
       (AllocatedAmount - SpentAmount) AS RemainingAmount
FROM Budget;

-- Step 14: Create PurchaseOrder Table and PurchaseOrderItem Table
CREATE TABLE PurchaseOrder (
    POID INT PRIMARY KEY AUTO_INCREMENT,
    OrderDate DATE NOT NULL,
    TotalCost DECIMAL(15, 2) NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'Created',
    VendorID INT NOT NULL,
    ContractID INT NOT NULL,
    BudgetID INT NOT NULL,
    FOREIGN KEY (VendorID) REFERENCES Vendor(VendorID),
    FOREIGN KEY (ContractID) REFERENCES Contract(ContractID),
    FOREIGN KEY (BudgetID) REFERENCES Budget(BudgetID)
);

CREATE TABLE PurchaseOrderItem (
    POItemID INT PRIMARY KEY AUTO_INCREMENT,
    POID INT NOT NULL,
    Description VARCHAR(255) NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(15, 2) NOT NULL,
    TotalPrice DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (POID) REFERENCES PurchaseOrder(POID)
);

-- Step 15: Create Task Table for Procurement Process
CREATE TABLE Task (
    TaskID INT PRIMARY KEY AUTO_INCREMENT,
    AssignedTo INT NOT NULL,
    CreatedBy INT NOT NULL,
    TaskDescription TEXT NOT NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    DueDate DATE,
    FOREIGN KEY (AssignedTo) REFERENCES User(UserID),
    FOREIGN KEY (CreatedBy) REFERENCES User(UserID)
);

-- Step 16: Create AuditLog Table for Compliance and Auditing
CREATE TABLE AuditLog (
    AuditID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ActionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ActionType VARCHAR(50) NOT NULL,
    Description TEXT,
    FOREIGN KEY (UserID) REFERENCES User(UserID)
);

-- Step 17: Insert Roles into Role Table
INSERT INTO Role (RoleName) VALUES ('Admin'), ('Manager'), ('Vendor'), ('Procurement'), ('Finance');

-- Step 18: Insert Permissions into Permission Table
INSERT INTO Permission (PermissionName) VALUES
('ViewVendors'), ('ManageVendors'), ('ViewContracts'), ('ManageContracts'),
('CreatePurchaseOrders'), ('ApprovePurchaseOrders'), ('ViewBudgets'), ('AdjustBudgets'),
('ViewNotifications'), ('ManageTasks'), ('ViewReports');

-- Step 19: Assign Permissions to Roles in RolePermission Table
-- Admin Role
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 1, PermissionID FROM Permission;

-- Manager Role
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 2, PermissionID FROM Permission WHERE PermissionName IN ('ViewVendors', 'ViewContracts', 'CreatePurchaseOrders', 'ViewBudgets', 'ViewNotifications', 'ManageTasks', 'ViewReports');

-- Vendor Role
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 3, PermissionID FROM Permission WHERE PermissionName IN ('ViewContracts', 'ViewNotifications');

-- Procurement Role
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 4, PermissionID FROM Permission WHERE PermissionName IN ('ViewVendors', 'ManageVendors', 'ViewContracts', 'ManageContracts', 'CreatePurchaseOrders', 'ApprovePurchaseOrders', 'ViewBudgets', 'AdjustBudgets', 'ManageTasks', 'ViewReports');

-- Finance Role
INSERT INTO RolePermission (RoleID, PermissionID)
SELECT 5, PermissionID FROM Permission WHERE PermissionName IN ('ViewBudgets', 'AdjustBudgets', 'ViewReports');

-- Step 20: Insert Sample Data into Department Table
INSERT INTO Department (DepartmentName)
VALUES ('Procurement'), ('Finance'), ('IT'), ('HR');

-- Step 21: Insert Sample Vendors into Vendor Table
INSERT INTO Vendor (Name, ServiceCategory, ContactInfo, ComplianceCertifications)
VALUES 
('Tech Solutions', 'IT Services', 'tech@solutions.com', 'ISO 9001'),
('Global Logistics', 'Transportation', 'contact@global.com', 'ISO 45001'),
('Office Supplies Co.', 'Office Supplies', 'contact@officesupplies.com', 'ISO 14001');

-- Step 22: Insert Users into User Table (Including Vendors)
-- Admin User
INSERT INTO User (UserName, Email, Password, RoleID)
VALUES ('Jane Smith', 'jane.smith@example.com', 'password456', 1);

-- Manager User
INSERT INTO User (UserName, Email, Password, DepartmentID, RoleID)
VALUES ('John Doe', 'john.doe@example.com', 'password123', (SELECT DepartmentID FROM Department WHERE DepartmentName = 'Procurement'), 2);

-- Procurement User
INSERT INTO User (UserName, Email, Password, DepartmentID, RoleID)
VALUES ('Emily Clark', 'emily.clark@example.com', 'password789', (SELECT DepartmentID FROM Department WHERE DepartmentName = 'Procurement'), 4);

-- Finance User
INSERT INTO User (UserName, Email, Password, DepartmentID, RoleID)
VALUES ('Michael Brown', 'michael.brown@example.com', 'password321', (SELECT DepartmentID FROM Department WHERE DepartmentName = 'Finance'), 5);

-- Vendor Users
INSERT INTO User (UserName, Email, Password, VendorID, RoleID)
VALUES 
('Vendor User 1', 'vendor1@techsolutions.com', 'vendorpass1', 1, 3),
('Vendor User 2', 'vendor2@globallogistics.com', 'vendorpass2', 2, 3);

-- Step 23: Update Departments with ManagerID
-- DepartmentName is now a unique key, so safe update mode allows this
UPDATE Department
SET ManagerID = (SELECT UserID FROM User WHERE UserName = 'John Doe')
WHERE DepartmentName = 'Procurement';

UPDATE Department
SET ManagerID = (SELECT UserID FROM User WHERE UserName = 'Michael Brown')
WHERE DepartmentName = 'Finance';

-- Step 24: Insert Sample Budgets
INSERT INTO Budget (DepartmentID, AllocatedAmount)
VALUES
((SELECT DepartmentID FROM Department WHERE DepartmentName = 'Procurement'), 500000.00),
((SELECT DepartmentID FROM Department WHERE DepartmentName = 'Finance'), 300000.00);

-- Step 25: Insert Sample Contracts
INSERT INTO Contract (VendorID, DepartmentID, StartDate, EndDate, Status)
VALUES
(1, (SELECT DepartmentID FROM Department WHERE DepartmentName = 'IT'), '2023-01-01', '2023-12-31', 'Active'),
(2, (SELECT DepartmentID FROM Department WHERE DepartmentName = 'Procurement'), '2023-06-01', '2024-05-31', 'Active');

-- Step 26: Insert Sample Contract Versions
INSERT INTO ContractVersion (ContractID, VersionNumber, ModifiedDate, ModifiedBy, ContractContent)
VALUES
(1, 1, '2023-01-01', (SELECT UserID FROM User WHERE UserName = 'Emily Clark'), 'Initial Contract Content for Tech Solutions'),
(2, 1, '2023-06-01', (SELECT UserID FROM User WHERE UserName = 'John Doe'), 'Initial Contract Content for Global Logistics');

-- Step 27: Insert Sample Purchase Orders
INSERT INTO PurchaseOrder (OrderDate, TotalCost, Status, VendorID, ContractID, BudgetID)
VALUES
('2023-07-15', 25000.00, 'Approved', 1, 1, (SELECT BudgetID FROM Budget WHERE DepartmentID = (SELECT DepartmentID FROM Department WHERE DepartmentName = 'Procurement'))),
('2023-08-10', 15000.00, 'Pending Approval', 2, 2, (SELECT BudgetID FROM Budget WHERE DepartmentID = (SELECT DepartmentID FROM Department WHERE DepartmentName = 'Procurement')));

-- Step 28: Insert Sample Purchase Order Items
INSERT INTO PurchaseOrderItem (POID, Description, Quantity, UnitPrice, TotalPrice)
VALUES
(1, 'Server Maintenance', 1, 25000.00, 25000.00),
(2, 'Logistics Services', 1, 15000.00, 15000.00);

-- Step 29: Insert Sample Vendor Performance Evaluations
INSERT INTO VendorPerformance (VendorID, EvaluationDate, ServiceQuality, Timeliness, Pricing, Feedback)
VALUES
(1, '2023-09-01', 4.5, 4.0, 4.8, 'Excellent service and support.'),
(2, '2023-09-15', 3.8, 4.2, 4.0, 'Good delivery times but pricing could be better.');

-- Step 30: Insert Sample Tasks
INSERT INTO Task (AssignedTo, CreatedBy, TaskDescription, DueDate)
VALUES
((SELECT UserID FROM User WHERE UserName = 'Emily Clark'), (SELECT UserID FROM User WHERE UserName = 'John Doe'), 'Negotiate new contract terms with Tech Solutions.', '2023-10-01'),
((SELECT UserID FROM User WHERE UserName = 'Michael Brown'), (SELECT UserID FROM User WHERE UserName = 'Jane Smith'), 'Prepare budget report for Q4.', '2023-10-15');

-- Step 31: Insert Sample Audit Logs
INSERT INTO AuditLog (UserID, ActionType, Description)
VALUES
((SELECT UserID FROM User WHERE UserName = 'Jane Smith'), 'Login', 'Admin user logged in.'),
((SELECT UserID FROM User WHERE UserName = 'John Doe'), 'CreateContract', 'Created new contract with Global Logistics.');

-- Step 32: Create Triggers

-- Trigger to Update Vendor's PerformanceRating based on VendorPerformance entries
DELIMITER //
CREATE TRIGGER UpdateVendorPerformanceRating
AFTER INSERT ON VendorPerformance
FOR EACH ROW
BEGIN
    DECLARE avgRating DECIMAL(3,2);
    SELECT AVG((ServiceQuality + Timeliness + Pricing)/3) INTO avgRating FROM VendorPerformance WHERE VendorID = NEW.VendorID;
    UPDATE Vendor SET PerformanceRating = avgRating WHERE VendorID = NEW.VendorID;
END;
//
DELIMITER ;

-- Trigger to Update SpentAmount in Budget after PurchaseOrder is Approved
DELIMITER //
CREATE TRIGGER UpdateBudgetSpentAmount
AFTER UPDATE ON PurchaseOrder
FOR EACH ROW
BEGIN
    IF NEW.Status = 'Approved' AND OLD.Status != 'Approved' THEN
        UPDATE Budget
        SET SpentAmount = SpentAmount + NEW.TotalCost
        WHERE BudgetID = NEW.BudgetID;
    END IF;
END;
//
DELIMITER ;

-- Step 33: Create Stored Procedures

-- Stored Procedure for Vendor Registration
DELIMITER //
CREATE PROCEDURE RegisterVendor (
    IN p_UserName VARCHAR(255),
    IN p_Email VARCHAR(255),
    IN p_Password VARCHAR(255),
    IN p_VendorName VARCHAR(255),
    IN p_ServiceCategory VARCHAR(100),
    IN p_ContactInfo TEXT,
    IN p_ComplianceCertifications TEXT
)
BEGIN
    DECLARE v_VendorID INT;
    INSERT INTO Vendor (Name, ServiceCategory, ContactInfo, ComplianceCertifications)
    VALUES (p_VendorName, p_ServiceCategory, p_ContactInfo, p_ComplianceCertifications);
    SET v_VendorID = LAST_INSERT_ID();
    INSERT INTO User (UserName, Email, Password, VendorID, RoleID)
    VALUES (p_UserName, p_Email, p_Password, v_VendorID, (SELECT RoleID FROM Role WHERE RoleName = 'Vendor'));
END;
//
DELIMITER ;

-- Stored Procedure for Contract Renewal
DELIMITER //
CREATE PROCEDURE RenewContract (
    IN p_ContractID INT,
    IN p_NewEndDate DATE,
    IN p_UserID INT
)
BEGIN
    UPDATE Contract
    SET EndDate = p_NewEndDate, Status = 'Renewed'
    WHERE ContractID = p_ContractID;
    INSERT INTO AuditLog (UserID, ActionType, Description)
    VALUES (p_UserID, 'RenewContract', CONCAT('Contract ID ', p_ContractID, ' renewed.'));
END;
//
DELIMITER ;

-- Stored Procedure for Vendor Performance Evaluation
DELIMITER //
CREATE PROCEDURE EvaluateVendorPerformance (
    IN p_VendorID INT,
    IN p_EvaluationDate DATE,
    IN p_ServiceQuality DECIMAL(5,2),
    IN p_Timeliness DECIMAL(5,2),
    IN p_Pricing DECIMAL(5,2),
    IN p_Feedback TEXT
)
BEGIN
    INSERT INTO VendorPerformance (VendorID, EvaluationDate, ServiceQuality, Timeliness, Pricing, Feedback)
    VALUES (p_VendorID, p_EvaluationDate, p_ServiceQuality, p_Timeliness, p_Pricing, p_Feedback);
END;
//
DELIMITER ;

-- Step 34: Create Procedures for Notifications

-- Procedure to Check Contract Renewals
DELIMITER //
CREATE PROCEDURE CheckContractRenewals()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE c_ContractID INT;
    DECLARE c_EndDate DATE;
    DECLARE cur_contracts CURSOR FOR SELECT ContractID, EndDate FROM Contract WHERE EndDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur_contracts;
    read_loop: LOOP
        FETCH cur_contracts INTO c_ContractID, c_EndDate;
        IF done THEN
            LEAVE read_loop;
        END IF;
        INSERT INTO Notification (UserID, NotificationDate, Message)
        SELECT UserID, CURDATE(), CONCAT('Contract ID ', c_ContractID, ' is expiring on ', c_EndDate)
        FROM User WHERE RoleID IN (1,2,4); -- Notify Admin, Manager, Procurement
    END LOOP;
    CLOSE cur_contracts;
END;
//
DELIMITER ;

-- Procedure to Check Budget Alerts
DELIMITER //
CREATE PROCEDURE CheckBudgetAlerts()
BEGIN
    INSERT INTO Notification (UserID, NotificationDate, Message)
    SELECT U.UserID, CURDATE(), CONCAT('Budget overrun in Department ', D.DepartmentName)
    FROM User U
    JOIN Department D ON U.DepartmentID = D.DepartmentID
    JOIN Budget B ON D.DepartmentID = B.DepartmentID
    WHERE B.SpentAmount > B.AllocatedAmount AND U.RoleID IN (1,2,5); -- Notify Admin, Manager, Finance
END;
//
DELIMITER ;

-- Step 35: Test Triggers and Procedures

-- Approve a Purchase Order to test UpdateBudgetSpentAmount Trigger
UPDATE PurchaseOrder
SET Status = 'Approved'
WHERE POID = 2;

-- Call Procedure to Check Contract Renewals
CALL CheckContractRenewals();

-- Call Procedure to Check Budget Alerts
CALL CheckBudgetAlerts();

-- Step 36: Verify Data

-- Show Tables
SHOW TABLES;

-- View BudgetView
SELECT * FROM BudgetView;

-- View Notifications
SELECT * FROM Notification;

-- View VendorPerformance
SELECT * FROM VendorPerformance;

-- View PurchaseOrder
SELECT * FROM PurchaseOrder;

-- View PurchaseOrderItem
SELECT * FROM PurchaseOrderItem;

-- View Vendors
SELECT * FROM Vendor;

-- View Users
SELECT * FROM User;

-- View Departments
SELECT * FROM Department;

-- View Contracts
SELECT * FROM Contract;

-- View Tasks
SELECT * FROM Task;

-- View AuditLog
SELECT * FROM AuditLog;




