if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/QR-Code-Generator/TW-pay/service_worker.js')
      .then(reg => console.log('SW registered!', reg))
      .catch(err => console.log('Boo!', err));
}
// IndexedDB startup
var db;
var bankAccount = window.indexedDB.open("TWBankAccountDatabase", 2);
bankAccount.onerror = function (event) {
    document.getElementById("btn-load").display = 'none';
    document.getElementById("btn-save").display = 'none';
};
bankAccount.onupgradeneeded = function (event) {
    db = event.target.result;
    var objectStore = db.createObjectStore("account", {
        keyPath: "name"
    });
    objectStore.createIndex("name", "name", {
        unique: true
    });
    objectStore.createIndex("bank_no", "bank_no", {
        unique: false
    });
    objectStore.createIndex("account_no", "account_no", {
        unique: false
    });
};
bankAccount.onsuccess = function (event) {
    db = bankAccount.result;
};
// get TW bank code
var bankList = {};
fetch("/QR-Code-Generator/TW-pay/tw-bank-data.json").then(function (response) {
    return response.json();
}).then(function (json) {
    for (let i = 0; i < json["bank"].length; i++) {
        bankList[json["bank"][i]["code"]] = json["bank"][i]["name"];
        let e = document.createElement("option");
        e.text = json["bank"][i]["code"] + " - " + json["bank"][i]["name"];
        document.getElementById("bankDatalist").appendChild(e);
    }
});
// set account data to IndexedDB
function setAccount(name, bank, account) {
    var transaction = db.transaction(["account"], "readwrite");
    var objectStore = transaction.objectStore("account");
    objectStore.add({
        "name": name,
        "bank": bank,
        "account": account
    });
}
// get QR code from Google
function getQRcode(IMGId, uri) {
    fetch("https://chart.googleapis.com/chart", {
        body: `cht=qr&chl=${uri}&chs=100x100`,
        method: "POST",
        mode: "cors"
    }).then(function (response) {
        return response.blob();
    }).then(function (blob) {
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            document.getElementById(IMGId).src = e.target.result;
            document.getElementById(IMGId).previousElementSibling.remove();
        };
        fileReader.readAsDataURL(blob);
    }).catch(error => {
        setTimeout(function () {
            getQRcode(IMGId, uri);
        }, 2000);
    });;
}
// TWQRP
class TWQRP {
    constructor(bank, account, other) {
        this.bank = bank;
        this.account = account;
        this.other = other;
        this.getURL();
    }
    getURL() {
        let other_info = "";
        for (let i = this.account.length; i < 16; i++) {
            this.account = "0" + this.account;
        }
        if ("amount" in this.other) {
            other_info = other_info + `&D1=${this.other.amount}00`;
        }
        if ("message" in this.other) {
            other_info = other_info + `&D9=${this.other.message}`;
        }
        this.url = `TWQRP://${this.bank.name}/158/02/V1?D5=${this.bank.code}&D6=${this.account}${other_info}`;
        return this.url;
    }
    getURI() {
        return encodeURIComponent(this.url);
    }
    setIMG(IMGId) {
        getQRcode(IMGId, this.getURI());
    }
}
// add payment info
function addInfo() {
    var paymentList = document.getElementById("paymentList")
    var div = document.createElement("div");
    let newCard = paymentList.childElementCount;
    div.id = `payment${newCard}`;
    div.classList.add('col-md-3');
    div.classList.add(`payment${newCard}c`);
    div.innerHTML = `<div class="card">
    <div class="card-body">
      <h5 id="payment${newCard}Title" class="payment${newCard}c card-title">#${newCard+1}</h5>
      <div class="row g-2 align-items-center">
    <div class="col-12">
      <label for="payment${newCard}amount" class="col-form-label"><span class="material-icons-outlined align-middle">paid</span>
      <span class="align-middle">金額</span></label>
      <input id="payment${newCard}amount" type="number" class="payment${newCard}c form-control" min="1" required/>
    </div>
    <div class="col-12">
      <label for="payment${newCard}message" class="col-form-label"><span class="material-icons-outlined align-middle">message</span>
      <span class="align-middle">訊息/留言/備註</span></label>
      <input id="payment${newCard}message" type="text" class="payment${newCard}c form-control"/>
    </div>
    <div class="col-12">
      <button id="payment${newCard}Remove" type="button" onclick="removeInfo(this.id);" class="payment${newCard}c btn btn-danger">
      <span class="material-icons-outlined align-middle">delete</span><span class="align-middle">刪除</span></button>
    </div>
</div>
    </div>
  </div></div>`
    paymentList.appendChild(div);
}
// remove payment info
function removeInfo(id) {
    var i = parseInt(id.replace(/^\D+/g, ''));
    var last = document.getElementById("paymentList").childElementCount;
    if (i != last - 1) {
        for (i = i + 1; i < last; i++) {
            document.getElementById(`payment${i-1}amount`).value = document.getElementById(`payment${i}amount`).value;
            document.getElementById(`payment${i-1}message`).value = document.getElementById(`payment${i}message`).value;
        }
    }
    document.getElementById(`payment${last-1}`).remove();
}
// check the data of user inputed and return it
function checkBankData() {
    var bankCode = document.getElementById("bank").value.split(' ')[0];
    if (!bankList.hasOwnProperty(bankCode)) {
        document.getElementById("bank").value = "";
        document.getElementById('form').classList.add('was-validated');
        document.getElementById('form').addEventListener("input", function () {
            document.getElementById('form').classList.remove('was-validated');
        })
    } else if (document.getElementById('form').checkValidity()) {
        return {
            bank: {
                code: bankCode,
                name: bankList[bankCode]
            },
            account: document.getElementById("account").value
        };
    }
    document.getElementById('form').reportValidity();
    return undefined;
}
// make QR Code
function createQRCode() {
    var bankData = checkBankData();
    if (checkBankData() != undefined) {
        var qrBody = document.getElementById("QRCode");
        qrBody.innerHTML = `<div class="col-12">
        <span class="material-icons-outlined align-middle">account_balance</span>
        <span class="align-middle">銀行: ${bankData.bank.code} ${bankData.bank.name}</span><br>
        <span class="material-icons-outlined align-middle">account_balance_wallet</span>
        <span class="align-middle">收款帳號: ${bankData.account}</span>
        </div>`;
        var paymentList = document.getElementById("paymentList");
        if (paymentList.childElementCount > 0) {
            for (let i = 0; i < paymentList.childElementCount; i++) {
                let message = document.getElementById(`payment${i}message`).value
                let other = {
                    amount: document.getElementById(`payment${i}amount`).value,
                    message: message
                }
                if (other.message=="") {delete other.message;}
                var twqr = new TWQRP(
                    bankData.bank, bankData.account, other);
                qrBody.innerHTML = qrBody.innerHTML + `
            <div id="QRCodeCard${i}" class="card ">
                <div class="card-body">
                    <h5 class="card-title">#${i+1}</h5>
                    <div class="text-center">
                        <div class="col-12">
                            <p class="p">金額:${other.amount}</p>
                            <p class="p">訊息/留言/備註:${message}</p>
                        </div>
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <img id="QRCodeIMG${i}" with="100" heigh="100" 
                            twqr-bank-code="${bankData.bank.code}"
                            twqr-bank-name="${bankData.bank.name}"
                            twqr-account="${bankData.account}"
                            twqr-amount="${other.amount}"
                            twqr-message="${message}"
                        />
                        <div class="btn-group col-12" role="group">
                            <button class="btn btn-primary" type="button" 
                            onclick="download('${bankData.bank.code}${bankData.account}.png', 'QRCodeIMG${i}');">
                            <span class="material-icons-outlined align-middle">file_download</span>
                            <span class="align-middle">下載</span></button>
                            <button class="btn btn-primary" type="button" onclick="share('QRCodeIMG${i}');">
                            <span class="material-icons-outlined align-middle">share</span>
                            <span class="align-middle">分享</span></button>
                        </div>
                    </div>
                </div>
            </div>`
                twqr.setIMG(`QRCodeIMG${i}`);
            }
        } else {
            var twqr = new TWQRP(bankData.bank, bankData.account, {});
            qrBody.innerHTML += `
            <div class="card ">
                <div class="card-body">
                  <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <img id="QRCodeIMG" with="100" heigh="100" 
                        twqr-bank-code="${bankData.bank.code}"
                        twqr-bank-name="${bankData.bank.name}"
                        twqr-account="${bankData.account}"
                    />
                    <div class="btn-group col-12" role="group">
                        <button class="btn btn-primary" type="button" 
                        onclick="download('${bankData.bank.code}${bankData.account}.png', 'QRCodeIMG');">
                        <span class="material-icons-outlined align-middle">file_download</span>
                        <span class="align-middle">下載</span></button>
                        <button class="btn btn-primary" type="button" onclick="share('QRCodeIMG');">
                        <span class="material-icons-outlined align-middle">share</span>
                        <span class="align-middle">分享</span></button>
                    </div>
                  </div>
                </div>
            </div>`
            twqr.setIMG("QRCodeIMG");
        }
        new bootstrap.Modal(document.getElementById('QRCodeModal')).show();
    }
}
// ===================== //
// Account storage action
// show load/save modal
function showLoad() {
    let body = document.getElementById('accountLoad');
    body.innerHTML = ``;
    var transaction = db.transaction("account", 'readonly');
    var objectStore = transaction.objectStore("account");
    if ('getAll' in objectStore) {
        objectStore.getAll().onsuccess = function (event) {
            let all = event.target.result;
            for (let i = 0; i < all.length; i++)
                body.innerHTML = body.innerHTML + `<li class="list-group-item d-flex g-2 justify-content-between align-items-start">
            <div class="ms-2 me-auto">
              <div class="fw-bold">${all[i].name}</div>
              ${all[i].bank} ${bankList[all[i].bank]}<br>
              ${all[i].account}
            </div>
            <div class="btn-group col-7" role="group">
                <button type="button" class="btn btn-primary " data-bs-dismiss="modal" onclick="loadAccount('${all[i].name}');">
                <span class="material-icons-outlined align-middle">smart_button</span><span class="align-middle">使用</span></button>
                <button type="button" class="btn btn-danger " data-bs-dismiss="modal" onclick="removeAccount('${all[i].name}');">
                <span class="material-icons-outlined align-middle">delete</span><span class="align-middle">刪除</span></button>
            </div>
          </li>`;
            if (all.length == 0) {
                body.innerHTML = `<li class="list-group-item d-flex g-2 justify-content-between align-items-start disabled">
            <div class="ms-2 me-auto">
              <div class="fw-bold">
                <span class="material-icons-outlined align-middle">info</span>
                <span class="align-middle">你沒有銀行帳號儲存在此電腦的瀏覽器上</span>
              </div>
            </div>
          </li>`;
            }
        };
    }
    new bootstrap.Modal(document.getElementById('accountLoadModal')).show();
}

function showSave() {
    new bootstrap.Modal(document.getElementById('accountSaveModal')).show();
}
// show load/save/remove action
function loadAccount(name) {
    var request = db.transaction(["account"])
        .objectStore("account")
        .get(name);
    request.onsuccess = function (event) {
        document.getElementById("bank").value = request.result.bank;
        document.getElementById("account").value = request.result.account;
    };
}

function saveAccount() {
    var bankData = checkBankData();
    if (checkBankData() != undefined && document.getElementById("name").value != "") {
        setAccount(
            document.getElementById("name").value,
            bankData.bank.code,
            bankData.account
        )
        document.getElementById("name").value = "";
    }
}

function removeAccount(name) {
    db.transaction(["account"], "readwrite")
        .objectStore("account")
        .delete(name);
}
// share
function navigator_share(blob) {
    const filesArray = [
        new File(
            [blob],
            'qr_code.png', {
                type: blob.type,
                lastModified: new Date().getTime()
            }
        )
    ];
    navigator.share({
        files: filesArray,
        title: '台灣Pay 轉帳 QR Code',
    });
}
function twqr_ft_title(element) {
    let data = {
        bank: {
            code:element.getAttribute('twqr-bank-code'),
            name:element.getAttribute('twqr-bank-name')},
        account: element.getAttribute('twqr-account'),
        amount: element.getAttribute('twqr-amount'),
        message: element.getAttribute('twqr-message')
    }
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");
    // clear
    context.clearRect(0, 0, canvas.width, canvas.height);
    // set background
    context.fillStyle = "whitesmoke";
    context.fillRect(0, 0, canvas.width, canvas.height);
    // set text
    context.lineWidth = 1;
    context.fillStyle = "#000000";
    context.lineStyle = "#ffff00";
    context.font = "18px sans-serif";
    context.fillText(`銀行: ${data.bank.code} ${data.bank.name}`, 20, 40);
    context.fillText(`收款帳號: ${data.account}`, 20, 60);
    if (data.amount != "" && data.amount!= null) {
        context.fillText(`金額: ${data.amount}`, 20, 80);
    }
    if (data.message != "" && data.message!= null) {
        context.fillText(`訊息/留言/備註: ${data.message}`, 20, 100);
    }
    context.fillText(`時間: ${new Date().toLocaleString('zh-TW')}`, 20, 240);
    context.drawImage(element, 100, 120);
    return canvas.toDataURL("image/png");
}
function share(eid) {
    if (navigator.canShare!=undefined) {
        let durl = twqr_ft_title(document.getElementById(eid));
        console.log(durl)
        fetch(durl)
        .then(res => res.blob())
        .then(blob => navigator_share(blob));
    } else {
        alert("這個瀏覽器/裝置不支援分享功能");
    }
}
function download(name, eid) {
    var link = document.createElement("a");
    link.download = name;
    link.href = twqr_ft_title(document.getElementById(eid));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}