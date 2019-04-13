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

function getIndex(arr, val) {
    var index = 0;
    for (var i in arr) {
        if (arr[i].product_name == val) {
            index = i;
            return index;
        }
    }
}

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
    return makeQuery("lowinv", queryObject);
}

function makeQuery(queryType, qObject) {
    if (queryType == "lowinv") {
        connection.query(qObject.method, qObject.qArray, function(err, res) {
            if (err) throw err;
            if (res.length > 0 ) {
                console.log("The following products have fewer than " + qObject.qArray[2] + " units in stock.");
                for (var i = 0; i < res.length; i++) {
                    console.log("\n" + res[i].product_name + "\nID: " + res[i].item_id + "\nUnits Remaining: " + res[i].stock_quantity);
                }
            }
            else {
                console.log("No products have fewer than 10 units in stock. Rejoice!");
            }
        })
    } //end of lowinv if

    if (queryType == "addinv") {
        connection.query(qObject.method, qObject.qArray, function(err, res) {
            if (err) throw err;
            console.log("\nStock for item with ID " + qObject.qArray[4] + " set to " + qObject.qArray[2]);
            
        })

    } //end of addinv If

    if (queryType == "newproduct") {

    } //end of newproduct If

    
    returnToMenu();
}

function addToInventory() {
    var productArray = [];

    connection.query("SELECT * FROM products", function(err, results) {
        if (err) throw err;
        console.log("\nID  " + "|  Product  " + "|  Department  " + "|  Price  " + "|  In Stock");
        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            console.log(item.item_id + " | " + item.product_name + " | " + item.department_name + " | " + item.price.toFixed(2) + " | " + item.stock_quantity );
            productArray.push(item);
        }
    })
    setTimeout(function() {
        var choiceArray = []
        for (var i = 0; i < productArray.length; i++) {
            choiceArray.push(productArray[i].product_name);
        }
        
        inquirer.prompt([
            {
                name: "product",
                message: "Which product would you like to restock?",
                type: "list",
                choices: choiceArray
            }
        ]).then(function(res) {
            var prodIndex = getIndex(productArray, res.product);
            console.log(productArray[prodIndex]);
            return plusInventory(productArray[prodIndex]);
            
        })
    }, 100)
}

function plusInventory(productObject) {
    console.log("You selected " + productObject.product_name + ".\nHow many would you like to add to the current stock of " + productObject.stock_quantity + "?");
    inquirer.prompt([
        {
            name: "howmuch",
            type: "number",
            message: "Enter a positive number: "
        }
    ]).then(function(ans) {
        if (typeof ans.howmuch != "number" || ans.howmuch < 0) {
            console.log("Invalid entry. Killing process because I DONT KNOW");
            return launchFunc(closeConnection);
        } else
        {
            var newAmount = (parseInt(ans.howmuch) + productObject.stock_quantity);
            var inArray = ["products", "stock_quantity", newAmount, "item_id", productObject.item_id ];
            var queryString = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
            var queryObject = new QueryBuild(queryString, inArray);
            return makeQuery("addinv", queryObject);
        }
    })

}