export function passwordToggle(){
document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const input = button.closest(".input-group").querySelector("input");
    const icon = button.querySelector("i");
    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";
    icon.classList.toggle("fa-eye", !isHidden);
    icon.classList.toggle("fa-eye-slash", isHidden);
  });
});  
}