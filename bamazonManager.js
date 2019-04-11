var login = require("./login"); 
//This file is put in gitignore for obvious reasons
//login.js is simply a file in the same directory as this, with the following in it:
/* var password = password_string;

module.exports = {
    password
}; */
//Replace password_string with your mysql root password. Or password for whatever user you input below

var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
  
    // Your port; if not 3306
    port: 3306,
  
    // Your username
    user: "root",
  
    // Your password
    password: login.password,
    database: "bamazon"
  }
);

connection.connect(function(err) {
    if (err) throw err;
    launchFunc(initMenu);
})

var mainMenu = ["View Products for Sale", "View Low Inventory","Add to Inventory","Add New Product", "Disconnect"];

var QueryBuild = function(method, arr) {
    this.method = method;
    this.qArray = arr;
};

function closeConnection() {
    console.log("Disconnecting.\nEnd of Line");
    return connection.end();
}

function returnToMenu() {
    inquirer.prompt([
        {
            name: "menucmd",
            type: "list",
            choices: ["Return to Main Menu"],
            message: "Continue?"
        }
    ]).then(function(ans) {
        if (ans) {
            return launchFunc(initMenu);
        }
        else
        {
            console.log("Against all odds, this app has somehow failed to fail properly.");
            
            process.exit();
        };
    })
};

function launchFunc(func) {
    return func();
}

function initMenu() {
    console.log("\nGreetings, Manager.");
    
    inquirer.prompt([
        {
            name: "command",
            type: "list",
            choices: mainMenu,
            message: "Select command: "
        }
    ]).then(function(ans) {
        return execCommand(ans.command);
    })
}

function execCommand(cmd) {
    switch (cmd) {
        case "View Products for Sale":
            return viewProducts();
        case "View Low Inventory":
            return viewLowInventory();
        case "Add to Inventory":
            return addToInventory();
        case "Add New Product":
            return addNewProduct();
        case "Disconnect":
            return launchFunc(closeConnection);
        default:
            console.log("Unknown Command");
            return launchFunc(closeConnection);
    }
}

function viewProducts() {
    connection.query("SELECT * FROM products", function(err, results) {
        if (err) throw err;
        console.log("\nID  " + "|  Product  " + "|  Department  " + "|  Price  " + "|  In Stock");
        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            console.log(item.item_id + " | " + item.product_name + " | " + item.department_name + " | " + item.price.toFixed(2) + " | " + item.stock_quantity );
        }
        returnToMenu();
    })
}

function viewLowInventory() {
    var inArray = ["products", "stock_quantity", 10 ];
    var queryString = "SELECT * FROM ?? WHERE ?? < ?";
    var queryObject = new QueryBuild(queryString, inArray);
    return makeQuery(queryObject);
}

function makeQuery(qObject) {
    connection.query(qObject.method, qObject.qArray, function(err, res) {
        if (err) throw err;
        console.log(res);
        if (res.length > 0 ) {
            console.log("The following products have fewer than " + qObject.qArray[2] + " units in stock.");
            for (var i = 0; i < res.length; i++) {
                console.log("\n" + res[i].product_name + "\nID: " + res[i].item_id + "\nUnits Remaining: " + res[i].stock_quantity);
            }
        }
        else {
            console.log("No products have fewer than 10 units in stock. Rejoice!");
        }
        returnToMenu();
    })
}