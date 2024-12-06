console.clear();

let orderData = [];

// 初始化
function init() {
    getOrders();
}
init();

// 取得訂單列表
function getOrders() {
    axios.get(`${url}/api/livejs/v1/admin/${api_path}/orders`, headers)
        .then((response) => {
            orderData = response.data.orders;
            renderOrderList();
            renderC3_LV2();
        })
        .catch((error) => {
            console.log(error);
        });
}

// 渲染訂單列表畫面
const orderList = document.querySelector('.orderPage-table tbody');
function renderOrderList() {
    let str = '';
    orderData.forEach((item) => {
        // 組產品訂單品項字串
        let productStr = '';
        item.products.forEach((productItem) => {
            productStr += `<p>${productItem.title} ${productItem.quantity}個</p>`;
        });

        // 組訂單日期
        let timeStamp = new Date(item.createdAt*1000);
        let orderTime = `${timeStamp.getFullYear()}/${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;

        // 訂單狀態
        let orderStatus = '';
        if (item.paid === true) {
            orderStatus = '已處理';
        } else {
            orderStatus = '未處理';
        }

        // 組訂單表格
        str += `
            <tr>
                <td>${item.id}</td>
                <td>
                    <p>${item.user.name}</p>
                    <p>${item.user.tel}</p>
                </td>
                <td>${item.user.address}</td>
                <td>${item.user.email}</td>
                <td>${productStr}</td>
                <td>${orderTime}</td>
                <td>
                    <a href="#" class="orderStatus" data-id="${item.id}" data-status="${item.paid}">${orderStatus}</a>
                </td>
                <td>
                    <input type="button" class="delSingleOrder-Btn" data-id="${item.id}" value="刪除">
                </td>
            </tr>`;
    });
    orderList.innerHTML = str;
}

// 點擊訂單列表內按紐
orderList.addEventListener('click', (e) => {
    e.preventDefault();
    const delSingleOrderBtn = e.target.classList.contains('delSingleOrder-Btn');
    const orderStatusBtn = e.target.classList.contains('orderStatus');

    let orderId = e.target.dataset.id;
    if (delSingleOrderBtn) {
        deleteOrder(orderId);
        return;
    }
    if (orderStatusBtn) {
        let orderStatus = e.target.dataset.status;
        updateOrderStatus(orderId, orderStatus);
        return;
    }
})

// 修改訂單狀態
function updateOrderStatus(orderId, orderStatus) {
    let booleanStatus = orderStatus;
    if (orderStatus === 'true') {
        booleanStatus = true;
    } else {
        booleanStatus = false;
    }
    let newStatus = !booleanStatus;

    let updateOrderData = {
        "data": {
            "id": orderId,
            "paid": newStatus
        }
    }
    axios.put(`${url}/api/livejs/v1/admin/${api_path}/orders`, updateOrderData, headers)
        .then((response) => {
            console.log(response);
            getOrders();
        })
        .catch((error) => {
            console.log(error);
        });
}

// 刪除單筆訂單
function deleteOrder(orderId) {
    axios.delete(`${url}/api/livejs/v1/admin/${api_path}/orders/${orderId}`, headers)
    .then((response) => {
        console.log(response);
        getOrders();
    })
    .catch((error) => {
        console.log(error);
    });
}

// 刪除全部訂單
const discardAllBtn = document.querySelector('.orderPage-list .discardAllBtn');
discardAllBtn.addEventListener('click', (e) => {
    e.preventDefault();
    axios.delete(`${url}/api/livejs/v1/admin/${api_path}/orders`, headers)
        .then((response) => {
            getOrders();
            alert('刪除全部訂單成功');
        })
        .catch((error) => {
            console.log(error);
        });
})

// 渲染 C3.js - 全產品類別營收比重
function renderC3_LV1() {
    let categoryTotalObj = {};
    orderData.forEach((item) => {
        item.products.forEach((productItem) => {
            if (categoryTotalObj[productItem.category] === undefined) {
                categoryTotalObj[productItem.category] = productItem.price * productItem.quantity;
            } else {
                categoryTotalObj[productItem.category] += productItem.price * productItem.quantity;
            }
        })
    })
    let categoryTotalAry = Object.entries(categoryTotalObj);
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: categoryTotalAry
        },
        color: {
            pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#302E4D']
        }
    });
}

// 渲染 C3.js - 全品項營收比重，類別含四項，篩選出前三名營收品項，其他 4~8 名都統整為「其它」
function renderC3_LV2() {
    let titleTotalObj = {};
    orderData.forEach((item) => {
        item.products.forEach((productItem) => {
            if (titleTotalObj[productItem.title] === undefined) {
                titleTotalObj[productItem.title] = productItem.price * productItem.quantity;
            } else {
                titleTotalObj[productItem.title] += productItem.price * productItem.quantity;
            }
        })
    })
    let titleTotalAry = Object.entries(titleTotalObj);

    // 篩選出前三名營收品項
    titleTotalAry.sort((a, b) => b[1] - a[1]);
    
    // 將其他品項統整為「其它」
    if (titleTotalAry.length > 3) {
        let otherTotal = 0;
        titleTotalAry.forEach((item, index) => {
            if (index > 2) {
                otherTotal += item[1];
            }
        })
        titleTotalAry.splice(3, titleTotalAry.length - 3);
        titleTotalAry.push(['其它', otherTotal]);
    }
    
    
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: titleTotalAry
        },
        color: {
            pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#302E4D']
        }
    });
}
