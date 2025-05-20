function HideMain() {

}

function Run_Error(error) {
    document.getElementById("main-container").style.display = "none";
    document.getElementById("error-container").style.display = "block";

    document.getElementById("error-message").innerText = error;
}

function Run_Main(attributes) {

}

function LockInName() {

}

function Start() {
    const attributes = document.getElementById("injected-attributes");
    const test = true;
    const unv = true;
    const name = "Flowerboy"

    if (test) {
        if (unv) {
            document.getElementById("static-name").style.display = "none";
            document.getElementById("editable-name").style.display = "";

            document.getElementById("editable-name").querySelector("input").value = name;
        } else {
            document.getElementById("static-name").innerText = `Username: ${name}`;
        }
    }

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

    document.getElementById("a").innerText = `Username: ${username}`;
    document.getElementById("b").innerText = `Email: ${email}`;
    document.getElementById("c").innerText = (attributes.getAttribute("data-username-unavailable") == "true");
}

Start();