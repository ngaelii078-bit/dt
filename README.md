# dt

DT Plumbing website for Tristan Maugeri, covering plumbing, maintenance, renovations and handyman services, with 24-hour plumbing support.

Open `index.html` in a browser. It is a standalone, responsive HTML file with embedded styling, JavaScript, photographs, logo and fonts. No installation or build is required, and the page works offline.

The website uses black, white and charcoal to match the supplied logo, with full-colour photography. It includes a mobile menu, service carousel, FAQs, an enquiry builder, a floating WhatsApp button and a demo AI assistant.

Contact details have not been supplied. The enquiry builder prepares a request locally; it does not send messages or book visits.

The demo assistant uses fixed website information and a guided enquiry flow. It works offline without an API key, does not call an AI model, and cannot send messages, book visits or dispatch assistance. Visitors can review their chat draft in the enquiry form.

The WhatsApp button currently opens a coming-soon notice. To connect it, find `const widgetConfig = { whatsappNumber: '' };` inside `index.html` and add the international business number, including its country code. The button will then open a WhatsApp chat when clicked.

Bathroom photographs are illustrative Unsplash imagery. Manrope and DM Sans font licenses and the Bootstrap Icons MIT license for the WhatsApp glyph are included inside the HTML file.
