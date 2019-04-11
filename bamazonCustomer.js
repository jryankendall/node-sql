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
    launchStore();
})

function getIndex(arr, val) {
    var index = 0;
    for (var i in arr) {
        if (arr[i].name == val) {
            index = i;
            return index;
        }
    }
}

function launchStore() {
    listItems();
    promptUser();
}

function listItems() {
    connection.query("SELECT * FROM products", function(err, results) {
        if (err) throw err;
        console.log("ID  " + "|  Product  " + "|  Department  " + "|  Price  " + "|  In Stock");
        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            console.log(item.item_id + " | " + item.product_name + " | " + item.department_name + " | " + item.price.toFixed(2) + " | " + item.stock_quantity );
        }
    })
}

function promptUser() {
    var productArray = [];
    connection.query("SELECT * FROM products", function(err, results){
        if (err) throw err;
        var Product = function(id, name, dept, price, quantity) {
            this.id = id;
            this.name = name;
            this.department = dept;
            this.price = price;
            this.quantity = quantity;
        }
        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            var newItem = new Product(item.item_id, item.product_name, item.department_name, item.price, item.stock_quantity);
            productArray.push(newItem);
        }
        inquirer.prompt([
            {
                name: "choice",
                type: "list",
                message: "\nSelect a product you wish to purchase: ",
                choices: productArray
            }
        ]).then(function(answers) {
            var productIndex = getIndex(productArray, answers.choice);
            buyProduct(productArray[productIndex]);

        })
    }
    
    )
    
};

function buyProduct(product) {
    var itemBought = product;
    console.log("You selected: " + itemBought.name + ", priced at $" + itemBought.price.toFixed(2) + " per unit.");
    inquirer.prompt([
        {
            name: "isproduct",
            type: "confirm",
            message: "Is this correct?"
        }
    ]).then(function(answer) {
        if (answer.isproduct) {
           return confirmPurchase(itemBought);
        } else 
        {
            listItems();
            return promptUser();
        }
    })
};

function confirmPurchase(item) {
    inquirer.prompt([
        {
            name: "amount",
            type: "number",
            message: "How many would you like to purchase?"
        }
    ]).then(function(answer) {
        if (isNaN(answer.amount) || answer.amount < 1) {
            console.log("Invalid entry, defaulting to 1");
            return makeTransaction(item, 1);
        } else
        {
            console.log("Purchasing " + parseInt(answer.amount) + " will run you a total of " + (parseInt(answer.amount)*item.price).toFixed(2));
            inquirer.prompt([
                {
                    name: "amountcheck",
                    type: "confirm",
                    message: "Is this okay?"
                }
            ]).then(function(ans) {
                if (ans.amountcheck) {
                    return makeTransaction(item, parseInt(answer.amount));
                } else
                {
                    connection.end();
                    return console.log("Suit yourself! Terminating transaction.\nEnd of Line");
                }
            })
        }
    })
}

function makeTransaction(purchase, amount) {
    console.log(purchase);
    if (amount > purchase.quantity) {
        connection.end();
        return console.log("Error: Out of range. Amount requested greater than stock. You requested: " + amount + "\nNumber in stock is: " + purchase.quantity + "\nEnd of line.");
    }
    else
    {
        var netAmount = (purchase.quantity-amount);
        buyFromServer(purchase.id, netAmount, "products", "item_id", "stock_quantity");
    }
}

function buyFromServer(productid, number, table, key, column) {
    var productArray = [table, column, number, key, productid];
    return connection.query("UPDATE ?? SET ?? = ? WHERE ?? = ?", productArray, function(err, res) {
        if (err) throw err;
        console.log("\nPurchase successful. Number of this product left in stock: " + number);
        console.log("End of line");
        connection.end();
    });
}