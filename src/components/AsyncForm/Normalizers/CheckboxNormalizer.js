/**
 * @param {HTMLFormElement} form
 * @param {FormData} formData
 */
export default function CheckboxNormalizer(form, formData) {
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.name) {
            formData.set(checkbox.name, checkbox.checked ? 'true' : 'false');
        }
    });
}
