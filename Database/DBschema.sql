CREATE DATABASE RisingEmber;
USE RisingEmber;

CREATE TABLE Admin (
admin_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100),
password VARCHAR(255),
created_at DATE,
status VARCHAR(50)
);

CREATE TABLE Customer (
customer_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100),
phone VARCHAR(20),
password VARCHAR(255),
address TEXT,
registration_date DATE
);

CREATE TABLE ServiceProvider (
provider_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100),
phone VARCHAR(20),
service_type VARCHAR(100),
rating_average FLOAT,
verification_status VARCHAR(50)
);


CREATE TABLE Arbitrator (
arbitrator_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100),
specialization VARCHAR(100),
experience_years INT,
status VARCHAR(50),
created_date DATE
);


CREATE TABLE Service (
service_id INT AUTO_INCREMENT PRIMARY KEY,
provider_id INT,
service_name VARCHAR(100),
description TEXT,
price DECIMAL(10,2),
category VARCHAR(100),
availability_status VARCHAR(50),
FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
);

CREATE TABLE Booking (
booking_id INT AUTO_INCREMENT PRIMARY KEY,
customer_id INT,
service_id INT,
booking_date DATE,
booking_status VARCHAR(50),
FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
FOREIGN KEY (service_id) REFERENCES Service(service_id)
);


CREATE TABLE BankingServer (
bank_id INT AUTO_INCREMENT PRIMARY KEY,
bank_name VARCHAR(100),
gateway_name VARCHAR(100),
transaction_status VARCHAR(50),
server_status VARCHAR(50)
);

CREATE TABLE Payment (
payment_id INT AUTO_INCREMENT PRIMARY KEY,
booking_id INT,
bank_id INT,
amount DECIMAL(10,2),
payment_date DATE,
payment_status VARCHAR(50),
transaction_id VARCHAR(100),
FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
FOREIGN KEY (bank_id) REFERENCES BankingServer(bank_id)
);

CREATE TABLE Dispute (
dispute_id INT AUTO_INCREMENT PRIMARY KEY,
booking_id INT,
customer_id INT,
provider_id INT,
dispute_reason TEXT,
dispute_status VARCHAR(50),
created_date DATE,
FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id)
);

CREATE TABLE Evidence (
evidence_id INT AUTO_INCREMENT PRIMARY KEY,
dispute_id INT,
file_path VARCHAR(255),
description TEXT,
submission_date DATE,
FOREIGN KEY (dispute_id) REFERENCES Dispute(dispute_id)
);

CREATE TABLE ChatMessage (
message_id INT AUTO_INCREMENT PRIMARY KEY,
dispute_id INT,
sender_id INT,
message_content TEXT,
timestamp DATETIME,
FOREIGN KEY (dispute_id) REFERENCES Dispute(dispute_id)
);

CREATE TABLE Ruling (
ruling_id INT AUTO_INCREMENT PRIMARY KEY,
dispute_id INT,
arbitrator_id INT,
decision TEXT,
ruling_date DATE,
notes TEXT,
FOREIGN KEY (dispute_id) REFERENCES Dispute(dispute_id),
FOREIGN KEY (arbitrator_id) REFERENCES Arbitrator(arbitrator_id)
);

CREATE TABLE RefundRequest (
refund_request_id INT AUTO_INCREMENT PRIMARY KEY,
dispute_id INT,
payment_id INT,
refund_reason TEXT,
request_date DATE,
status VARCHAR(50),
FOREIGN KEY (dispute_id) REFERENCES Dispute(dispute_id),
FOREIGN KEY (payment_id) REFERENCES Payment(payment_id)
);


CREATE TABLE RefundTransaction (
refund_id INT AUTO_INCREMENT PRIMARY KEY,
refund_request_id INT,
bank_id INT,
refund_amount DECIMAL(10,2),
refund_status VARCHAR(50),
processed_date DATE,
FOREIGN KEY (refund_request_id) REFERENCES RefundRequest(refund_request_id),
FOREIGN KEY (bank_id) REFERENCES BankingServer(bank_id)
);

CREATE TABLE Feedback (
feedback_id INT AUTO_INCREMENT PRIMARY KEY,
customer_id INT,
provider_id INT,
service_id INT,
rating INT,
comment TEXT,
feedback_date DATE,
FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
FOREIGN KEY (provider_id) REFERENCES ServiceProvider(provider_id),
FOREIGN KEY (service_id) REFERENCES Service(service_id)
);

