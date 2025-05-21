function HideMain() {

}

function Run_Error(error) {
    document.getElementById("main-container").style.display = "none";
    document.getElementById("error-container").style.display = "block";

    document.getElementById("error-message").innerText = error;
}

function Run_Main(attributes) {

}

async function LockInName() {
    const input = document.getElementById("editable-name").querySelector("input");
    const params = new URLSearchParams(window.location.search);
    const token = params.get("Token");
    const name = input.value;

    const response = await fetch('/api/lock-registration-name', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Token: token,
            Name: name
        })
    });

    const data = await response.json();
    if (!data.Success) {
        console.log("Error: ", data.Message);

        return;
    }

    document.getElementById("static-name").innerText = `Username: ${name}`;

    document.getElementById("editable-name").style.display = "none";
    document.getElementById("static-name").style.display = "";

    return;
}

async function CreateAccount() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("Token");

    const response = await fetch('/api/confirm-registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Token: token })
    });

    const data = await response.json();
    if (!data.Success) {
        console.log("Error: ", data.Message);

        return;
    }

    console.log("Succcess: ", data.Message);
    return;
}

async function CancelSignup() {

}

function Start() {
    const attributes = document.getElementById("injected-attributes");

    if (!attributes) {
        return;
    }

    const error = attributes.getAttribute("data-error");

    if (error) {
        Run_Error(error);

        return;
    }

    Run_Main(attributes);

    const username = attributes.getAttribute('data-username');
    const email = attributes.getAttribute('data-email');
    const unavailable = (attributes.getAttribute("data-username-unavailable") == "true");

    if (unavailable) {
        document.getElementById("static-name").style.display = "none";
        document.getElementById("editable-name").style.display = "";

        document.getElementById("editable-name").querySelector("input").value = username;
    } else {
        document.getElementById("static-name").innerText = `Username: ${username}`;
    }

    document.getElementById("static-email").innerText = `Email: ${email}`;
}

Start();