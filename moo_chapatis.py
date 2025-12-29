from flask import Flask, render_template_string, request, jsonify, redirect, url_for, session
from datetime import datetime, timedelta
import os
import json
import eventlet
eventlet.monkey_patch()

from flask_socketio import SocketIO

app = Flask(__name__)
app.secret_key = "moo_secret_key"

# Initialize SocketIO
socketio = SocketIO(app)


# ===== CONFIGURATION =====
UNIT_PRICE = 20
CONTACTS = ["0718 357 737-Alimoo"]
ORDERS_FILE = "orders.json"
ADMIN_PASSWORD = "0708ALIMOO"

# ===== ORDER HELPERS =====
def load_orders():
    if not os.path.exists(ORDERS_FILE):
        return []
    with open(ORDERS_FILE, "r") as f:
        return json.load(f)

def save_orders(orders):
    with open(ORDERS_FILE, "w") as f:
        json.dump(orders, f, indent=2)

def cleanup_orders():
    orders = load_orders()
    now = datetime.now()
    orders = [o for o in orders if datetime.fromisoformat(o["expires_at"]) > now]
    save_orders(orders)

def save_new_order(product, quantity, total_price, location):
    cleanup_orders()
    orders = load_orders()
    order = {
        "product": product,
        "quantity": quantity,
        "total_price": total_price,
        "location": location,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=4)).isoformat()
    }
    orders.append(order)
    save_orders(orders)

    socketio.emit('new_order', order)
    print("🔔 NEW ORDER RECEIVED:", order)

    return order


# ===== ROUTES =====
@app.route('/', methods=['GET', 'POST'])
def index():
    cleanup_orders()
    total_price = 0
    order_submitted = False
    order_info = None

    if request.method == 'POST':
        product = request.form.get('product')
        quantity = int(request.form.get('quantity', 0))
        location = request.form.get('location')
        total_price = quantity * UNIT_PRICE
        order_submitted = True

        # Save order immediately
        order_info = save_new_order(product, quantity, total_price, location)

    return render_template_string(TEMPLATE,
                                  total_price=total_price,
                                  order_submitted=order_submitted,
                                  unit_price=UNIT_PRICE,
                                  contacts=CONTACTS,
                                  order_info=order_info)

# ===== ADMIN LOGIN =====
@app.route('/admin')
@app.route('/admin', methods=['GET', 'POST'])
def admin_login():
    return "<h2>Admin Login</h2><p>Use your credentials to access orders.</p>"


@app.route('/admin/orders')
def admin_orders():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))
    
    cleanup_orders()
    orders = load_orders()
    
    return render_template_string("""
<h2>Active Orders</h2>
<table border="1" cellpadding="8" id="orders_table" style="margin:auto;">
    <tr>
        <th>Product</th><th>Qty</th><th>Total</th><th>Location</th><th>Expires</th>
    </tr>
    {% for o in orders %}
    <tr>
        <td>{{ o['product'] }}</td>
        <td>{{ o['quantity'] }}</td>
        <td>{{ o['total_price'] }}</td>
        <td>{{ o['location'] }}</td>
        <td>{{ o['expires_at'] }}</td>
    </tr>
    {% endfor %}
</table>
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
    var socket = io();

    socket.on('new_order', function(order) {
        // live table update
        var table = document.getElementById('orders_table');
        var row = table.insertRow(-1);
        row.insertCell(0).innerText = order.product;
        row.insertCell(1).innerText = order.quantity;
        row.insertCell(2).innerText = order.total_price;
        row.insertCell(3).innerText = order.location;
        row.insertCell(4).innerText = order.expires_at;

        // browser notification for admin
        if (Notification.permission === "granted") {
            let notif = new Notification("New Order Received!", {
                body: `Product: ${order.product}\nQty: ${order.quantity}\nTotal: KES ${order.total_price}`
            });

            // clicking notification brings admin to orders page
            notif.onclick = function() {
                window.location.href = "/admin/orders";
            };
        } else {
            Notification.requestPermission();
        }
    });

    // request permission at load
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
</script>
""", orders=orders)





# ===== HTML TEMPLATE =====
TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Moo Chapatis</title>
    <style>
        body {
            background-image: url('/static/moo.png');
            background-size: cover;
            font-family: Arial, sans-serif;
            color: #333;
        }
        .container {
            background: rgba(255,255,255,0.85);
            max-width: 500px;
            margin: 50px auto;
            padding: 20px;
            border-radius: 10px;
        }
        h1, h2 { text-align: center; }
        label { display:block; margin:10px 0 5px; }
        input, textarea { width:100%; padding:8px; margin-bottom:10px; }
        .total { font-weight:bold; text-align:right; }
        .contacts, .slogans, .bonus { text-align:center; margin-top:15px; }
        button { background-color:#f4a261; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; }
        button:hover { background-color:#e76f51; }
        .order-popup {
            position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
            background:#fff; border:2px solid #333; padding:20px; z-index:1000; display:none;
            max-width:400px; border-radius:10px;
        }
        .overlay {
            position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:none; z-index:999;
        }
    </style>
    <script>
        function calculateTotal() {
            let quantity = document.getElementById('quantity').value;
            let total = quantity * {{ unit_price }};
            document.getElementById('total_price').innerText = total;
        }
        function copyMpesa(){
            navigator.clipboard.writeText("0718357737");
            alert("Number copied");
        }
        function showOrderPopup(){
            document.getElementById('overlay').style.display='block';
            document.getElementById('orderPopup').style.display='block';
        }
        function closePopup(){
            document.getElementById('overlay').style.display='none';
            document.getElementById('orderPopup').style.display='none';
        }
        window.onload = function(){
            {% if order_info %}
                showOrderPopup();
                // Browser notification
                if (Notification.permission === "granted"){
                    new Notification("New Order Received!", {
                        body: "{{ order_info['product'] }} x{{ order_info['quantity'] }}",
                    });
                } else if (Notification.permission !== "denied"){
                    Notification.requestPermission();
                }
            {% endif %}
        }
    </script>
</head>
<body>
<div class="container">
    <h1>Moo Chapatis</h1>
    <div class="slogans">Order, we Deliver</div>
    <form method="POST">
        <label for="product">Product</label>
        <input type="text" id="product" name="product" required>

        <label for="quantity">Quantity</label>
        <input type="number" id="quantity" name="quantity" min="1" value="1" onchange="calculateTotal()" required>

        <label>Price (KES)</label>
        <div class="total">Total: <span id="total_price">{{ unit_price }}</span></div>

        <label for="location">Location / Extra Information</label>
        <textarea id="location" name="location" required></textarea>

        <label><input type="checkbox" required> I confirm my order</label>
        <button type="submit">Submit Order</button>
    </form>

    <div class="bonus">First to buy 5 or more to get a bonus! Thanks..</div>
    <div class="contacts">Contacts: {% for c in contacts %}{{ c }} {% endfor %}</div>
</div>

<div id="overlay" class="overlay" onclick="closePopup()"></div>
<div id="orderPopup" class="order-popup">
    <h2>Order Summary</h2>
    {% if order_info %}
        <p>Product: {{ order_info['product'] }}</p>
        <p>Quantity: {{ order_info['quantity'] }}</p>
        <p>Total Price: KES {{ order_info['total_price'] }}</p>
        <p>Location: {{ order_info['location'] }}</p>
        <hr>
        <p><strong>MPESA PAYMENTS TO - 0718357737 (F****M)</strong></p>
        <input type="checkbox" id="copyCheckbox" style="display:none;" onclick="copyMpesa()">
<label for="copyCheckbox" style="cursor:pointer; color:blue; text-decoration:underline;">Copy number</label>

        <p>
        To our esteemed customer, you might receive a call to confirm your order shortly
        via your mpesa payment number. Keep screenshots of your mpesa messages for any queries.
        </p>
        <button onclick="closePopup()">Close</button>
    {% endif %}
</div>
</body>
</html>
"""

# ===== RUN =====
# ===== RUN =====
if __name__ == '__main__':
    if not os.path.exists('static'):
        os.makedirs('static')
    port = int(os.environ.get("PORT", 5000))  # use Render's assigned port
    socketio.run(app, debug=True, host='0.0.0.0', port=port)





