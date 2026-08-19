let selectedMonth = "";
let selectedCategory = null;
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
let spendChart = null;



// Load Data

document.addEventListener(
"DOMContentLoaded",
()=>{

    loadData();

    selectedMonth = data.budget.month || thisMonth();

    checkSetup();
	
	showPage('homePage');

});


function loadDashboardMonths(){

    const selects = document.querySelectorAll(".dashboardMonth");

    const months = [...new Set(
        data.expenses.map(e => e.date.substring(0,7))
    )];

    if(data.budget.month && !months.includes(data.budget.month)){
        months.push(data.budget.month);
    }

    months.sort().reverse();

    selects.forEach(select => {
        select.innerHTML = "";

        months.forEach(month => {
            const option = document.createElement("option");
            option.value = month;
            option.textContent = formatMonth(month);
            if(month === selectedMonth) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });

}

function formatMonth(month){

    if(!month) return "";

    const [year,m]=month.split("-");

    const months=[
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    return months[parseInt(m)-1]+" "+year;

}

function changeDashboardMonth(select){

    selectedMonth = select.value;
    console.log("Selected month changed to:", selectedMonth);

    updateDashboard();
    renderExpenses();

}

function showExpensesPage(){
    selectedCategory = null;
    showPage('expensesPage');
}


function saveData(){

    localStorage.setItem(
        "smartBudgetData",
        JSON.stringify(data)
    );

    console.log("Data saved:", data);

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


    // let spent =
    // data.expenses
    //     .filter(e => typeof e.date === "string" && e.date.startsWith(thisMonth()))
    //     .reduce(
    //         (sum,e)=>sum+e.amount,
    //         0
    //     );
    loadDashboardMonths();

    const monthExpenses =
    data.expenses.filter(e=>{

        return e.date.startsWith(selectedMonth);

    });

    let spent =
    monthExpenses.reduce(
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

    // Daily average for Food + Other categories and trend vs yesterday
    try {
        const targetNames = ["food", "other"];

        const targetCategoryIds = data.categories
            .filter(c => targetNames.includes((c.name || "").toLowerCase()))
            .map(c => c.id);

        let dailyAverage = 0;
        let daysInThisPeriod = 1;

        if (targetCategoryIds.length > 0) {
            const catExpenses = data.expenses.filter(e =>
                e.date.startsWith(selectedMonth) && targetCategoryIds.includes(e.category)
            );

            const totalCatSpent = catExpenses.reduce((s, e) => s + e.amount, 0);

            const [yy, mm] = (selectedMonth || thisMonth()).split("-");
            const year = Number(yy || new Date().getFullYear());
            const month = Number(mm || (new Date().getMonth() + 1));

            if (selectedMonth === thisMonth()) {
                daysInThisPeriod = new Date().getDate();
            } else {
                daysInThisPeriod = new Date(year, month, 0).getDate();
            }

            if (daysInThisPeriod < 1) daysInThisPeriod = 1;

            dailyAverage = totalCatSpent / daysInThisPeriod;
        }

        const dailyEl = document.getElementById("dailyAverage");
        if (dailyEl) {
            dailyEl.innerHTML = `${money(dailyAverage)} <span id="avgTrend" style="margin-left:8px;color:gray">—</span>`;
        }

        let todayDailyAverage = 0;
        let yesterdayDailyAverage = 0;

        if (targetCategoryIds.length > 0) {
            const [selectedYear, selectedMonthNumber] = (selectedMonth || thisMonth()).split('-');
            const yearNumber = Number(selectedYear);
            const monthNumber = Number(selectedMonthNumber);
            const daysInSelectedMonth = new Date(yearNumber, monthNumber, 0).getDate();
            const comparisonDay = selectedMonth === thisMonth()
                ? new Date().getDate()
                : daysInSelectedMonth;
            const previousDay = Math.max(comparisonDay - 1, 1);
            const monthPrefix = `${yearNumber}-${String(monthNumber).padStart(2, '0')}`;
            const todayStr = `${monthPrefix}-${String(comparisonDay).padStart(2, '0')}`;
            const yesterdayStr = `${monthPrefix}-${String(previousDay).padStart(2, '0')}`;

            const spentThroughToday = data.expenses
                .filter(e => e.date.startsWith(monthPrefix) && e.date <= todayStr && targetCategoryIds.includes(e.category))
                .reduce((s, e) => s + e.amount, 0);

            const spentThroughYesterday = data.expenses
                .filter(e => e.date.startsWith(monthPrefix) && e.date <= yesterdayStr && targetCategoryIds.includes(e.category))
                .reduce((s, e) => s + e.amount, 0);

            todayDailyAverage = spentThroughToday / comparisonDay;
            yesterdayDailyAverage = spentThroughYesterday / previousDay;
        }

        const trendEl = document.getElementById("avgTrend");
        if (trendEl) {
            if (todayDailyAverage > yesterdayDailyAverage) {
                trendEl.innerHTML = '<span style="color:red">↑</span>';
            } else {
                // Show a down arrow when today's value is equal to or below yesterday's.
                trendEl.innerHTML = '<span style="color:green">↓</span>';
            }
        }

        // Calculate remaining amount in Food+Other (sum of category limits - spent this month for those categories)
        const spentInTarget = data.expenses
            .filter(e => e.date.startsWith(selectedMonth) && targetCategoryIds.includes(e.category))
            .reduce((s, e) => s + e.amount, 0);

        const totalLimits = data.categories
            .filter(c => targetCategoryIds.includes(c.id))
            .reduce((s, c) => s + (Number(c.limit) || 0), 0);

        const remaining = totalLimits - spentInTarget;

        // survival daily average: half of the combined Food+Other limits (or fallback to overall budget)
        const combinedLimits = (Number(totalLimits) || 0) || (Number(data.budget.total) || 0);
        // total days in the selected month (always full month length, used only for survival calculation)
        const daysInMonthTotal = (function(){
            const [yy, mm] = (selectedMonth || thisMonth()).split('-');
            const year = Number(yy || new Date().getFullYear());
            const month = Number(mm || (new Date().getMonth() + 1));
            return new Date(year, month, 0).getDate();
        })();
        const survivalDaily = combinedLimits / 2 / (daysInMonthTotal || 1);
        console.log("Combined limits:", combinedLimits, "Survival daily average:", survivalDaily, "Remaining:", remaining, "Daily average:", dailyAverage, "Days in period:", daysInThisPeriod, "Days in month total:", daysInMonthTotal);
        // color daily average red if actual dailyAverage > survivalDaily
        if (dailyEl) {
            if (dailyAverage > survivalDaily) {
                dailyEl.style.color = 'red';
            } else {
                dailyEl.style.color = 'green';
            }
        }

        let daysLeftText = '';

        if (remaining <= 0) {
            daysLeftText = `0 days`;
        } else if (dailyAverage > 0) {
            const daysLeft = remaining / dailyAverage;
            const rounded = Math.floor(daysLeft);
            daysLeftText = `${rounded} days`;
        } else {
            daysLeftText = `∞ days`;
        }

        const daysEl = document.getElementById('daysLeft');
        if (daysEl) daysEl.innerText = daysLeftText;
    } catch (e) {
        console.error("Error calculating daily average/trend", e);
    }



    renderCategoryDashboard();

    loadCategorySelect();

    // render/update chart
    renderSpendingChart();


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


function thisMonth(){

    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

}


function renderCategoryDashboard(){

    const box=document.getElementById("categoryDashboard");

    box.innerHTML="";

    const expenses = data.expenses.filter(e=>{
        return e.date.startsWith(selectedMonth);
    });

    data.categories.forEach(c=>{

        let spent = expenses
        .filter(e=>e.category===c.id)
        .reduce((s,e)=>s+e.amount,0);

        let percent=Math.min(
            Math.round((spent/c.limit)*100),
            100
        );

        let remaining=c.limit-spent;

        box.innerHTML+=`

        <div class="category-card"
            style="background:${c.color};"
            onclick="showCategoryExpenses(${c.id})">

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


function deleteExpense(id){
    if(!confirm("Delete this expense?")) return;
    data.expenses = data.expenses.filter(e => e.id !== id);
    saveData();
    updateDashboard();
    renderExpenses();
    showPage('expensesPage');
}


// Attach swipe-to-delete handlers to rendered expense items.
function attachSwipeHandlers(){
    const items = document.querySelectorAll('.expense-item');
    items.forEach(item => {
        if(item.dataset.swipeAttached) return;
        item.dataset.swipeAttached = '1';

        const id = Number(item.getAttribute('data-id'));
        let startX = 0;
        let currentX = 0;
        let touching = false;
        const threshold = 80;

        const setTransform = (tx) => {
            item.style.transform = `translateX(${tx}px)`;
        };

        const onStart = (e) => {
            touching = true;
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            currentX = startX;
            item.style.transition = '';
        };

        const onMove = (e) => {
            if(!touching) return;
            currentX = e.touches ? e.touches[0].clientX : e.clientX;
            const dx = currentX - startX;
            if(dx > 0){
                setTransform(dx);
            } else {
                setTransform(0);
            }
        };

        const onEnd = () => {
            if(!touching) return;
            touching = false;
            const dx = currentX - startX;
            if(dx > threshold){
                // animate out then delete
                item.style.transition = 'transform 200ms ease-out, opacity 200ms';
                setTransform(window.innerWidth);
                item.style.opacity = '0';
                setTimeout(()=>{
                    deleteExpense(id);
                }, 200);
            } else {
                item.style.transition = 'transform 150ms ease-out';
                setTransform(0);
            }
        };

        item.addEventListener('touchstart', onStart, {passive:true});
        item.addEventListener('touchmove', onMove, {passive:true});
        item.addEventListener('touchend', onEnd);

        // mouse fallback for desktop drag
        let mouseDown = false;
        item.addEventListener('mousedown', (e) => { mouseDown = true; onStart(e); });
        window.addEventListener('mousemove', (e) => { if(!mouseDown) return; onMove(e); });
        window.addEventListener('mouseup', (e) => { if(!mouseDown) return; mouseDown = false; onEnd(e); });
    });
}






function updateSelectedMonthLabel(){

    const label = document.getElementById("selectedMonth");

    if(label){
        label.textContent = formatMonth(selectedMonth || data.budget.month || thisMonth());
    }

}

function showCategoryExpenses(categoryId){
    selectedCategory = categoryId;
    showPage('expensesPage');
}

function renderExpenses() {
    updateSelectedMonthLabel();

    const list = document.getElementById("expenseList");

    list.innerHTML = "";

    const expenses = data.expenses.filter(e => {
        const monthMatch = e.date.startsWith(selectedMonth);
        const categoryMatch = selectedCategory === null || e.category === selectedCategory;
        return monthMatch && categoryMatch;
    });

    if (expenses.length === 0) {

        list.innerHTML = `
            <div class="card">
                <h3>No expenses yet</h3>
                <p>Add your first expense.</p>
            </div>
        `;
        return;
    }

    expenses
        .slice()
        .reverse()
        .forEach(expense => {

            const category = data.categories.find(
                c => c.id === expense.category
            );

            list.innerHTML += `
                <div class="expense-item" data-id="${expense.id}">

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

    // Attach swipe handlers after rendering
    setTimeout(attachSwipeHandlers, 0);

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

function getAvailableMonths(){

    const months=[...new Set(

        data.expenses.map(e=>e.date.substring(0,7))

    )];

    months.sort();

    return months;

}

function previousExpenseMonth(){

    const months=getAvailableMonths();

    let index=months.indexOf(selectedMonth);

    if(index>0){

        selectedMonth=months[index-1];

    }

    renderExpenses();

}

function nextExpenseMonth(){

    const months=getAvailableMonths();

    let index=months.indexOf(selectedMonth);

    if(index<months.length-1){

        selectedMonth=months[index+1];

    }

    renderExpenses();

}


function getCategoryIdByName(name){
    const lower = (name||"").toLowerCase();
    const cat = data.categories.find(c=> (c.name||"").toLowerCase()===lower);
    return cat ? cat.id : null;
}


function renderSpendingChart(){
    const modeEl = document.getElementById('chartMode');
    if(!modeEl) return;
    const mode = modeEl.value || 'daily';

    const foodId = getCategoryIdByName('food');
    const otherId = getCategoryIdByName('other');

    const ctx = document.getElementById('spendChart');
    if(!ctx) return;

    let labels = [];
    let tooltipLabels = [];
    let weekRanges = []; // array of {start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'} for weekly mode
    let foodData = [];
    let otherData = [];

    const [selY, selM] = (selectedMonth || thisMonth()).split('-');
    const yearNum = Number(selY || new Date().getFullYear());
    const monthNum = Number(selM || (new Date().getMonth()+1));
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    if(mode === 'daily' || mode === 'weekly'){
        // operate on selectedMonth
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

        if(mode === 'daily'){
            for(let d=1; d<=daysInMonth; d++){
                const dd = String(d).padStart(2,'0');
                const mm = String(monthNum).padStart(2,'0');
                const dateStr = `${yearNum}-${mm}-${dd}`;
                labels.push(String(d));

                const foodSum = data.expenses.filter(e=>e.date===dateStr && e.category===foodId).reduce((s,e)=>s+e.amount,0);
                const otherSum = data.expenses.filter(e=>e.date===dateStr && e.category===otherId).reduce((s,e)=>s+e.amount,0);

                foodData.push(foodSum);
                otherData.push(otherSum);
            }
        } else {
            // calendar weeks: Sunday -> Saturday, include only days inside the selected month
            const firstDate = new Date(yearNum, monthNum-1, 1);
            const lastDate = new Date(yearNum, monthNum-1, daysInMonth);
            const firstWeekStart = new Date(firstDate);
            firstWeekStart.setDate(firstDate.getDate() - firstDate.getDay());

            let weekStart = new Date(firstWeekStart);

            while(weekStart <= lastDate){
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                const inStart = weekStart < firstDate ? new Date(firstDate) : new Date(weekStart);
                const inEnd = weekEnd > lastDate ? new Date(lastDate) : new Date(weekEnd);

                if(inStart > inEnd){
                    weekStart.setDate(weekStart.getDate() + 7);
                    continue;
                }

                const startMonthName = monthNames[inStart.getMonth()];
                const endMonthName = monthNames[inEnd.getMonth()];
                const rangeLabel = `${startMonthName} ${inStart.getDate()} - ${endMonthName} ${inEnd.getDate()}`;
                tooltipLabels.push(rangeLabel);
                labels.push(`Week ${tooltipLabels.length}`);
                weekRanges.push({
                    start: `${inStart.getFullYear()}-${String(inStart.getMonth()+1).padStart(2,'0')}-${String(inStart.getDate()).padStart(2,'0')}`,
                    end: `${inEnd.getFullYear()}-${String(inEnd.getMonth()+1).padStart(2,'0')}-${String(inEnd.getDate()).padStart(2,'0')}`
                });

                let fsum = 0, osum = 0;
                // sum expenses for days from inStart..inEnd
                for(let d = new Date(inStart); d <= inEnd; d.setDate(d.getDate() + 1)){
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2,'0');
                    const dd = String(d.getDate()).padStart(2,'0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    fsum += data.expenses.filter(e=>e.date===dateStr && e.category===foodId).reduce((s,e)=>s+e.amount,0);
                    osum += data.expenses.filter(e=>e.date===dateStr && e.category===otherId).reduce((s,e)=>s+e.amount,0);
                }

                foodData.push(fsum);
                otherData.push(osum);

                weekStart.setDate(weekStart.getDate() + 7);
            }
        }
    }
    else if(mode === 'monthly'){
        // monthly for a year - use yearNum
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        for(let m=1; m<=12; m++){
            const mm = String(m).padStart(2,'0');
            const monthStr = `${yearNum}-${mm}`;
            labels.push(monthNames[m-1]);
            const fsum = data.expenses.filter(e=>e.date.startsWith(monthStr) && e.category===foodId).reduce((s,e)=>s+e.amount,0);
            const osum = data.expenses.filter(e=>e.date.startsWith(monthStr) && e.category===otherId).reduce((s,e)=>s+e.amount,0);
            foodData.push(fsum);
            otherData.push(osum);
        }
    }

    // prepare chart
        if(window.Chart && ctx){
        if(spendChart){
            spendChart.destroy();
            spendChart = null;
        }

        spendChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Food',
                        data: foodData,
                        borderColor: '#ff7a59',
                        backgroundColor: 'rgba(255,122,89,0.12)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Other',
                        data: otherData,
                        borderColor: '#59a2ff',
                        backgroundColor: 'rgba(89,162,255,0.12)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            title: function(items){
                                if(!items || !items[0]) return '';
                                const idx = items[0].dataIndex;
                                return (tooltipLabels && tooltipLabels[idx]) || (items[0].label || '');
                            },
                            label: function(item){
                                const val = (item.parsed && item.parsed.y !== undefined) ? item.parsed.y : item.raw;
                                return item.dataset.label + ': ' + money(val);
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                },
                maintainAspectRatio: false
            }
        });

        // attach dblclick handler to navigate to expenses for the clicked week/category
        try {
            if(ctx._dblHandler){
                ctx.removeEventListener('dblclick', ctx._dblHandler);
                ctx._dblHandler = null;
            }

            const dblHandler = function(evt){
                const points = spendChart.getElementsAtEventForMode(evt, 'nearest', {intersect: true}, true);
                if(!points || !points.length) return;
                const pt = points[0];
                const dataIndex = pt.index;
                const datasetIndex = pt.datasetIndex;
                const catId = datasetIndex === 0 ? foodId : otherId;

                let start = null;
                let end = null;

                if(mode === 'weekly'){
                    if(!weekRanges.length) return;
                    const range = weekRanges[dataIndex];
                    if(!range) return;
                    start = range.start;
                    end = range.end;
                }
                else if(mode === 'daily'){
                    const day = dataIndex + 1;
                    const mm = String(monthNum).padStart(2,'0');
                    const dd = String(day).padStart(2,'0');
                    start = `${yearNum}-${mm}-${dd}`;
                    end = start;
                }
                else if(mode === 'monthly'){
                    const m = dataIndex + 1;
                    const mm = String(m).padStart(2,'0');
                    const lastDay = new Date(yearNum, m, 0).getDate();
                    start = `${yearNum}-${mm}-01`;
                    end = `${yearNum}-${mm}-${String(lastDay).padStart(2,'0')}`;
                }
                else {
                    return;
                }

                showExpensesForRange(catId, start, end);
            };

            ctx.addEventListener('dblclick', dblHandler);
            ctx._dblHandler = dblHandler;
        } catch(e){
            console.error('Failed to attach dblclick handler to chart', e);
        }
    }
}


// Show expenses for a specific category within a date range (inclusive)
function showExpensesForRange(categoryId, startISO, endISO){

    selectedCategory = categoryId;

    showPage('expensesPage');

    const list = document.getElementById('expenseList');
    list.innerHTML = '';

    const expenses = data.expenses.filter(e => {
        return e.category === categoryId && e.date >= startISO && e.date <= endISO;
    }).sort((a,b)=> a.date.localeCompare(b.date));

    if(expenses.length === 0){
        list.innerHTML = `
            <div class="card">
                <h3>No expenses</h3>
                <p>No expenses for this period.</p>
            </div>
        `;
        return;
    }

    expenses.reverse().forEach(expense=>{
        const category = data.categories.find(c=>c.id===expense.category);
        list.innerHTML += `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-info">
                    <h3>${category ? category.icon : '📌'} ${category ? category.name : 'Unknown'}</h3>
                    <small>${expense.description || 'No description'}</small>
                    <br>
                    <small>${expense.date}</small>
                </div>
                <div>
                    <strong>${money(expense.amount)}</strong>
                </div>
            </div>
        `;
    });

    // Attach swipe handlers for range-filtered expenses
    setTimeout(attachSwipeHandlers, 0);

}

