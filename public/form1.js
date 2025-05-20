const form = document.querySelector("form")
const ul = document.querySelector("ul");

form.onsubmit = handleSubmit

function liAdd(name, surname, email) {
  const li = document.createElement("li");
  li.innerHTML = name + " " + surname + " " + email;
  ul.appendChild(li);
}
async function handleSubmit() {
  // liAdd(form.firstname.value, form.lastname.value, form.email.value);
  //   form.reset()
  //   alert("user added")
  const data = {
    name: form.firstname.value,
    surname: form.lastname.value,
    email: form.email.value
  }
    try {
      const response = await fetch('/signup', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify( data )
      });

      const result = await response.json();

      if (response.ok) {
          messageDiv.textContent = result.message || 'Signup successful!';
          messageDiv.classList.add('success');
          document.getElementById('signupForm').reset();
      } else {
          messageDiv.textContent = result.message || 'Signup failed.';
          messageDiv.classList.add('error');
      }
  } catch (error) {
      messageDiv.textContent = 'An error occurred: ' + error.message;
      messageDiv.classList.add('error');
  }
}


