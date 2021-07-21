// variable to hold connection
let db;

// establish connection called 'budget_tracker' and set to version 1
const request = indexedDB.open('budget_tracker, 1');

// emit if database version changes
request.onupgradeneeded = function(event) {
    // save a reerence to the database
    const db = event.target.result;
    // create object store (table) called 'new_budget', set to auto increment
    db.createObjectStore('new_transaction', { autoIncrement: true});
};

// upon success
request.onsuccess = function(event) {
    // when db is sucessully created save to db variable
    db = event.target.result;

    //check if app is ononline, if yes run uploadBudget()
    if (navigator.online) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// this function will execute if attempt to submit budget with no internet connection
function saveRecord(record) {
    // open new transaction with the database with read and write permission
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store for 'new_budget'
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add record to store with add method
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    // open transaction on db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to variable
    const getAll = transactionObjectStore.getAll();

    // after sucess getAll
    getAll.onsuccess = function() {
        // if data in indexedDb send to api server
        if (getAll.result.length > 0) {

            // is this correct route??
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access new_budget object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all items in store
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
    // why is this not working??
// listen for app to come back online
window.addEventListener('online', uploadtransaction);

};

