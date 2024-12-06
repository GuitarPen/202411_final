console.clear();

// utility js
// 將數字轉成千分位
const toThousandths = (value) => {
    value = parseInt(value);
    if (isNaN(value)) {
        return
    } else {
        return value.toLocaleString();
    }
}

let productData = [];
let cartData = [];

// 取得產品列表
function getProducts() {
    axios.get(`${url}/api/livejs/v1/customer/${api_path}/products`)
        .then((response) => {
            productData = response.data.products;
            renderProductList(productData);
        })
        .catch((error) => {
            console.log(error);
        });
}

// 渲染產品畫面
const productList = document.querySelector('.productWrap');
function renderProductList(data) {
    let str = '';
    data.forEach((item) => {
        str +=
            `<li class="productCard">
                <h4 class="productType">新品</h4>
                <img src="${item.images}" alt="${item.title}">
                <a href="#" class="addCardBtn" data-id="${item.id}">加入購物車</a>
                <h3>${item.title}</h3>
                <del class="originPrice">NT$${toThousandths(item.origin_price)}</del>
                <p class="nowPrice">NT$${toThousandths(item.price)}</p>
            </li>`;
    });
    productList.innerHTML = str;
}

// 篩選產品項目
const productSelect = document.querySelector('.productSelect');
productSelect.addEventListener('change', (e) => {
    let category = e.target.value;
    if (category === '全部') {
        renderProductList(productData);
        return;
    }
    let filterData = productData.filter((item) => item.category === category);
    renderProductList(filterData);
})

// 取得購物車列表
function getCarts() {
    axios.get(`${url}/api/livejs/v1/customer/${api_path}/carts`)
        .then((response) => {
            cartData = response.data.carts;
            let finalTotal = response.data.finalTotal;
            renderCartList(cartData, finalTotal);
        })
        .catch((error) => {
            console.log(error);
        });
}

// 渲染購物車畫面
const cartList = document.querySelector('.shoppingCart-table tbody');
const finalTotal = document.querySelector('.shoppingCart-table tfoot .finalTotal');
function renderCartList(data, total) {
    if (data.length === 0) {
        cartList.innerHTML = `<tr><td colspan="5">目前購物車無商品</td></tr>`;
        document.querySelector('.shoppingCart-table tfoot').style.display = 'none';
        return;
    }

    let str = '';
    data.forEach((item) => {
        str +=
            `<tr data-id="${item.id}">
                <td>
                    <div class="cardItem-title">
                        <img src="${item.product.images}" alt="${item.product.title}">
                        <p>${item.product.title}</p>
                    </div>
                </td>
                <td>NT$${toThousandths(item.product.price)}</td>
                <td><button class="minusBtn">-</button> ${item.quantity} <button class="addBtn">+</button></td>
                <td>NT$${toThousandths(item.product.price * item.quantity)}</td>
                <td class="discardBtn">
                    <a href="#" class="material-icons">
                        clear
                    </a>
                </td>
            </tr>`;
    });
    cartList.innerHTML = str;
    finalTotal.textContent = `NT$${toThousandths(total)}`;
    document.querySelector('.shoppingCart-table tfoot').style.display = 'table-footer-group';
}

// 點擊產品列表的加入購物車按紐
productList.addEventListener('click', (e) => {
    e.preventDefault();
    if (e.target.getAttribute('class') !== 'addCardBtn') {
        return;
    }
    addCart(e.target.dataset.id);
})

// 加入購物車
function addCart(productId) {
    let quantity = 1;
    cartData.forEach((item) => {
        if (item.product.id === productId) {
            quantity = item.quantity += 1; // 用++按多次才會增加數量，很奇怪
        }
    })

    let addCartData = {
        "data": {
            productId,  // 屬性名稱跟變數名稱一樣的話，可以省略
            quantity
        }
    }
    axios.post(`${url}/api/livejs/v1/customer/${api_path}/carts`, addCartData)
        .then((response) => {
            getCarts();
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "商品已加入購物車",
                showConfirmButton: false,
                timer: 1500
            });
        })
        .catch((error) => {
            console.log(error);
        });
}

// 編輯購物車產品數量
function updateCart(cartId, quantity) {
    let updateCartData = {
        "data": {
            "id": cartId,
            quantity
        }
    }
    axios.patch(`${url}/api/livejs/v1/customer/${api_path}/carts`, updateCartData)
        .then((response) => {
            getCarts();
        })
        .catch((error) => {
            console.log(error);
        });
}

// 刪除單筆購物車
function deleteCart(cartId) {
    axios.delete(`${url}/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
        .then((response) => {
            getCarts();
        })
        .catch((error) => {
            console.log(error);
        });
}

// 點擊我的購物車列表按鈕
cartList.addEventListener('click', (e) => {
    e.preventDefault();
    let cartId = e.target.closest('tr').getAttribute('data-id');

    // 編輯購物車產品數量
    let cartObj = {};
    const addBtn = e.target.classList.contains('addBtn');
    const minusBtn = e.target.classList.contains('minusBtn');
    if (addBtn || minusBtn) {
        cartData.forEach((item) => {
            if (item.id === cartId) {
                cartObj = item;
            }
        })
    }
    if (addBtn) {
        cartObj.quantity += 1;
    } else if (minusBtn) {
        cartObj.quantity -= 1;
        if (cartObj.quantity < 1) {
            cartObj.quantity = 1;
        }
    }
    updateCart(cartId, cartObj.quantity);

    // 刪除單筆購物車
    if (e.target.getAttribute('class') === 'material-icons') {
        deleteCart(cartId);
    }
})

// 刪除全部購物車
const discardAllBtn = document.querySelector('.shoppingCart-table tfoot .discardAllBtn');
discardAllBtn.addEventListener('click', (e) => {
    e.preventDefault();
    Swal.fire({
        title: "確定要清空購物車嗎?",
        text: "清空了就無法恢復喔!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "刪除所有品項"
    }).then((result) => {
        if (result.isConfirmed) {
            axios.delete(`${url}/api/livejs/v1/customer/${api_path}/carts`)
                .then((response) => {
                    getCarts();
                })
                .catch((error) => {
                    console.log(error);
                });

            Swal.fire({
                title: "刪除",
                text: "您的購物車已清空",
                icon: "success"
            });
        }
    });
})

// 驗證訂單資料
function validateOrder() {
    const form = document.querySelector(".orderInfo-form");
    const constraints = {
        "姓名": {
            presence: {
                message: "必填欄位"
            }
        },
        "電話": {
            presence: {
                message: "必填欄位"
            },
            length: {
                minimum: 8,
                message: "需超過 8 碼"
            }
        },
        "Email": {
            presence: {
                message: "必填欄位"
            },
            email: {
                message: "格式錯誤"
            }
        },
        "寄送地址": {
            presence: {
                message: "必填欄位"
            }
        }
    };

    let errors = validate(form, constraints);

    if (errors) {
        Object.keys(errors).forEach((key) => {
            document.querySelector(`[data-message="${key}"]`).textContent = errors[key];
        })
    }
    return errors;
}

// 送出購買訂單
function createOrder() {
    if (cartData.length === 0) {
        alert('購物車無品項');
        return;
    }

    if (validateOrder()) {
        return;
    }

    const customerName = document.querySelector('#customerName').value;
    const customerPhone = document.querySelector('#customerPhone').value;
    const customerEmail = document.querySelector('#customerEmail').value;
    const customerAddress = document.querySelector('#customerAddress').value;
    const customerPayment = document.querySelector('#tradeWay').value;
    const inputs = document.querySelectorAll(".orderInfo-form input[name]");

    let customerData = {
        "data": {
            "user": {
                "name": customerName,
                "tel": customerPhone,
                "email": customerEmail,
                "address": customerAddress,
                "payment": customerPayment
            }
        }
    }

    axios.post(`${url}/api/livejs/v1/customer/${api_path}/orders`, customerData)
        .then((response) => {
            getCarts();
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "訂單已送出",
                showConfirmButton: false,
                timer: 1500
            });
            document.querySelector('.orderInfo-form').reset();
            inputs.forEach((input) => {
                input.nextElementSibling.textContent = '';
            })
        })
        .catch((error) => {
            console.log(error);
        });
}

// 點擊送出預定資料按鈕
const orderInfoBtn = document.querySelector('.orderInfo-form .orderInfo-btn'); //送出購買訂單按鈕btn
orderInfoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    createOrder();
})

// 初始化
function init() {
    getProducts();
    getCarts();
}
init();
