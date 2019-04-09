DROP DATABASE IF EXISTS bamazon;
CREATE DATABASE IF NOT EXISTS bamazon;

USE bamazon;

CREATE TABLE products (
	item_id INTEGER(3) AUTO_INCREMENT NOT NULL,
    product_name VARCHAR(60) NOT NULL,
    department_name VARCHAR(30),
    price FLOAT(8, 2) NOT NULL,
    stock_quantity INTEGER(5) NOT NULL,
    PRIMARY KEY (item_id)
);