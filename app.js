let data = {

    budget: {
        total: 0,
        currency: "$",
        month: ""
    },

    categories: [],

    expenses: [],

    settings: {
        darkMode:false
    }

};



let editingCategory = null;



// Load Data

document.addEventListener(
"DOMContentLoaded",
()=>{

    loadData();

    checkSetup();
	
	showPage('homePage');

});





function saveData(){

    localStorage.setItem(
        "smartBudgetData",
        JSON.stringify(data)
    );

}




function loadData(){

    let saved =
    localStorage.getItem(
        "smartBudgetData"
    );


    if(saved){

        data = JSON.parse(saved);

    }

}






// Setup



function checkSetup(){

    if(data.budget.total > 0){

        document
        .getElementById("setupScreen")
        .classList.add("hidden");


        document
        .getElementById("mainApp")
        .classList.remove("hidden");


        document
        .getElementById("bottomNav")
        .classList.remove("hidden");


        updateDashboard();

    }

}





function saveSetup(){


    let money =
    Number(
        document.getElementById("setupMoney").value
    );


    let currency =
    document.getElementById("setupCurrency").value;


    let month =
    document.getElementById("setupMonth").value;



    if(!money || !month){

        alert(
        "Please complete setup"
        );

        return;

    }



    data.budget = {

        total:money,

        currency,

        month

    };


    saveData();


    location.reload();

}





// Navigation


function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
        page.style.display = "none";
    });

    const currentPage = document.getElementById(pageId);
    currentPage.style.display = "block";
    currentPage.classList.add("active");

    switch(pageId) {

        case "homePage":
            updateDashboard();
            break;

        case "expensesPage":
            renderExpenses();
            break;

        case "categoriesPage":
            renderCategories();
            break;

        case "addPage":
            loadCategorySelect();
            break;
    }
}





// Dashboard


function updateDashboard(){


    let spent =
    data.expenses.reduce(
        (sum,e)=>sum+e.amount,
        0
    );



    let balance =
    data.budget.total - spent;



    document.getElementById(
        "availableBalance"
    ).innerText =
    money(balance);



    document.getElementById(
        "totalBudget"
    ).innerText =
    money(data.budget.total);



    document.getElementById(
        "totalSpent"
    ).innerText =
    money(spent);



    renderCategoryDashboard();

    loadCategorySelect();


}






function money(value){

    return (
        data.budget.currency +
        Number(value)
        .toFixed(2)
    );

}







// Categories



function openCategoryForm(){


    document
    .getElementById("categoryForm")
    .classList.remove("hidden");


    editingCategory=null;

}





function saveCategory(){


    let name =
    categoryName.value;


    let icon =
    categoryIcon.value || "📌";


    let color =
    categoryColor.value;


    let limit =
    Number(categoryLimit.value);



    if(!name || !limit){

        alert(
        "Enter category details"
        );

        return;

    }



    if(editingCategory){


        let c =
        data.categories.find(
        x=>x.id===editingCategory
        );


        c.name=name;

        c.icon=icon;

        c.color=color;

        c.limit=limit;


    }

    else{


        data.categories.push({

            id:Date.now(),

            name,

            icon,

            color,

            limit

        });


    }



    saveData();


    document
    .getElementById("categoryForm")
    .classList.add("hidden");


    renderCategories();

    updateDashboard();

}






function renderCategories(){


    let box =
    document.getElementById(
        "categoryList"
    );


    box.innerHTML="";



    data.categories.forEach(c=>{


        box.innerHTML += `

        <div class="category-card" id="master-category-card">

            <div class="category-header">

            <div class="category-title">

            ${c.icon}

            ${c.name}

            </div>

            </div>


            <p>
            Limit:
            ${money(c.limit)}
            </p>


            <button onclick="editCategory(${c.id})">
            Edit
            </button>


            <button 
            class="danger"
            onclick="deleteCategory(${c.id})">
            Delete
            </button>


        </div>

        `;


    });


}





function editCategory(id){


    let c =
    data.categories.find(
        x=>x.id===id
    );


    editingCategory=id;


    categoryName.value=c.name;

    categoryIcon.value=c.icon;

    categoryColor.value=c.color;

    categoryLimit.value=c.limit;



    document
    .getElementById("categoryForm")
    .classList.remove("hidden");


}





function deleteCategory(id){


    if(
    confirm(
    "Delete category?"
    )){


        data.categories =
        data.categories.filter(
            c=>c.id!==id
        );


        saveData();

        renderCategories();

        updateDashboard();

    }

}








// Category Dashboard



function renderCategoryDashboard(){

    const box=document.getElementById("categoryDashboard");

    box.innerHTML="";

    data.categories.forEach(c=>{

        let spent=data.expenses
            .filter(e=>e.category===c.id)
            .reduce((s,e)=>s+e.amount,0);

        let percent=Math.min(
            Math.round((spent/c.limit)*100),
            100
        );

        let remaining=c.limit-spent;

        box.innerHTML+=`

        <div class="category-card"
            style="background:${c.color};">

            <div>

                <h3>${c.name} ${c.icon}</h3>

            </div>

            <div>

                <small>

                    ${money(spent)}

                    /

                    ${money(c.limit)}

                </small>

                <div class="progress">

                    <div
                        class="progress-bar"
                        style="width:${percent}%">
                    </div>

                </div>

                <small>

                    ${percent}% Used

                </small>

            </div>

        </div>

        `;

    });

}







// Expenses



function loadCategorySelect(){


    let select =
    document.getElementById(
        "expenseCategory"
    );


    select.innerHTML="";


    data.categories.forEach(c=>{


        select.innerHTML +=`

        <option value="${c.id}">
        ${c.icon} ${c.name}
        </option>

        `;


    });


}



function addExpense() {

    const amount = Number(document.getElementById("expenseAmount").value);
    const category = Number(document.getElementById("expenseCategory").value);
    const date = document.getElementById("expenseDate").value;
    const description = document.getElementById("expenseDescription").value;

    if (!amount || !category) {
        alert("Please enter amount and category.");
        return;
    }

    data.expenses.push({
        id: Date.now(),
        amount,
        category,
        date: date || new Date().toISOString().split("T")[0],
        description
    });

    saveData();

    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseDescription").value = "";
    document.getElementById("expenseDate").value = "";

    updateDashboard();
    renderExpenses();

    showPage("expensesPage");
}






function renderExpenses() {

    const list = document.getElementById("expenseList");

    list.innerHTML = "";

    if (data.expenses.length === 0) {

        list.innerHTML = `
            <div class="card">
                <h3>No expenses yet</h3>
                <p>Add your first expense.</p>
            </div>
        `;
        return;
    }

    data.expenses
        .slice()
        .reverse()
        .forEach(expense => {

            const category = data.categories.find(
                c => c.id === expense.category
            );

            list.innerHTML += `
                <div class="expense-item">

                    <div class="expense-info">

                        <h3>${category ? category.icon : "📌"} ${category ? category.name : "Unknown"}</h3>

                        <small>${expense.description || "No description"}</small>

                        <br>

                        <small>${expense.date}</small>

                    </div>

                    <div>

                        <strong>${money(expense.amount)}</strong>

                    </div>

                </div>
            `;

        });

}








// Dark Mode


function toggleDarkMode(){


    document.body
    .classList.toggle(
        "dark"
    );


    data.settings.darkMode =
    document.body.classList.contains(
        "dark"
    );


    saveData();

}





// CSV Export


function exportCSV(){


    let csv =
    "Amount,Category,Date,Description\n";


    data.expenses.forEach(e=>{


        let c =
        data.categories.find(
        x=>x.id===e.category
        );


        csv +=

        `${e.amount},${c?.name},${e.date},${e.description}\n`;


    });



    let blob =
    new Blob(
        [csv],
        {
            type:"text/csv"
        }
    );


    let url =
    URL.createObjectURL(blob);


    let a =
    document.createElement("a");


    a.href=url;

    a.download=
    "budget-export.csv";


    a.click();


}







// Backup


function backupData(){


    let blob =
    new Blob(
        [
        JSON.stringify(data,null,2)
        ],
        {
        type:"application/json"
        }
    );


    let a =
    document.createElement("a");


    a.href =
    URL.createObjectURL(blob);


    a.download =
    "budget-backup.json";


    a.click();

}







function restoreData(event){


    let file =
    event.target.files[0];


    let reader =
    new FileReader();



    reader.onload=e=>{


        data =
        JSON.parse(
            e.target.result
        );


        saveData();


        location.reload();


    };


    reader.readAsText(file);

}





// Monthly Reset


function monthlyReset(){


    if(
    confirm(
    "Reset expenses for new month?"
    )){


        data.expenses=[];

        saveData();

        updateDashboard();

    }


}







function clearAllData(){


    if(
    confirm(
    "Delete everything?"
    )){


        localStorage.clear();

        location.reload();

    }

}