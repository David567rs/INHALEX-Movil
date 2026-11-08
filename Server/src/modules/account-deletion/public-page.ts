/** Standalone, public HTML: usable without the mobile app or an existing session. */
export function renderAccountDeletionPage(nonce: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Eliminar cuenta y datos · INHALEX</title>
<style nonce="${nonce}">
:root{color-scheme:light;font-family:system-ui,sans-serif;color:#173b2a;background:#f6f8f2}*{box-sizing:border-box}body{margin:0;padding:32px 20px}main{max-width:660px;margin:auto}header{margin-bottom:28px}h1{font-size:clamp(1.8rem,5vw,2.5rem);line-height:1.15}p,li{line-height:1.65}.brand{font-weight:800;letter-spacing:.18em;color:#19603c}section{background:white;border:1px solid #d9e3d9;border-radius:24px;padding:24px;margin:20px 0}label{display:block;margin:18px 0 8px;font-weight:600}input{font:inherit;padding:14px;width:100%;border:1px solid #839b8d;border-radius:12px}input[type=checkbox]{width:22px;height:22px;flex-shrink:0}.confirm{display:flex;align-items:flex-start;gap:12px;font-weight:400}button{width:100%;font:inherit;font-weight:700;padding:15px;border:0;border-radius:14px;color:white;background:#175b38;cursor:pointer;margin-top:18px}button:disabled{opacity:.65;cursor:wait}a{color:#175b38;overflow-wrap:anywhere}input:focus,button:focus-visible,a:focus-visible{outline:3px solid #50a878;outline-offset:3px}[role=status]{white-space:pre-line;overflow-wrap:anywhere}small{display:block;line-height:1.6;color:#4d6256}.subtle{color:#4d6256}footer{font-size:.9rem;padding:12px 0 28px}@media(prefers-reduced-motion:no-preference){button{transition:background .15s}button:hover{background:#0e4629}}
</style></head><body><main>
<header><p class="brand">INHALEX</p><h1>Eliminación de cuenta y datos</h1><p>Solicita la eliminación de tu cuenta de INHALEX y de los datos personales asociados, incluso si ya desinstalaste la aplicación.</p></header>
<section aria-labelledby="procedure"><h2 id="procedure">Cómo funciona</h2>
<p>La solicitud queda registrada para que el responsable de INHALEX la atienda mediante <a href="mailto:danielcruzhernandezinhalex@gmail.com">danielcruzhernandezinhalex@gmail.com</a>. Recibir la solicitud no significa que la cuenta ya fue eliminada.</p>
<p>El alcance solicitado incluye perfil, direcciones, favoritos, bolsa, avisos, reseñas y vinculaciones de la cuenta. Si fuera necesario conservar información por un pedido, una devolución o una obligación legal, el responsable deberá indicar los datos, el motivo y el plazo aplicable antes de cerrar la solicitud.</p>
<p class="subtle">Este formulario no cancela pedidos ni realiza reembolsos. La cuenta permanece disponible mientras se atiende la solicitud.</p></section>
<section aria-labelledby="request-title"><h2 id="request-title">Enviar solicitud</h2>
<form id="deletion-form" method="post" action="" autocomplete="on">
<label for="email">Correo de tu cuenta</label><input id="email" name="email" type="email" autocomplete="username" required maxlength="254">
<label for="password">Contraseña actual</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="128">
<label class="confirm" for="confirmation"><input id="confirmation" name="confirmation" type="checkbox" required><span>Quiero solicitar la eliminación de mi cuenta y sus datos asociados.</span></label>
<button type="submit" id="submit">Solicitar eliminación</button>
<p id="result" role="status" aria-live="polite" tabindex="-1"></p>
<small>No guardamos tu contraseña en la solicitud. No necesitas instalar la app.</small>
</form><noscript><p>Para usar el formulario activa JavaScript o solicita ayuda en el correo de contacto. Nunca envíes tu contraseña por correo.</p></noscript></section>
<footer><p><strong>¿No puedes entrar a tu cuenta?</strong> Escribe desde tu correo de registro a <a href="mailto:danielcruzhernandezinhalex@gmail.com?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta%20INHALEX">danielcruzhernandezinhalex@gmail.com</a> con el asunto «Solicitud de eliminación de cuenta INHALEX». El responsable verificará tu identidad. No envíes contraseñas ni datos de pago.</p><p>INHALEX S.A.S. de C.V. · Huejutla de Reyes, Hidalgo, México.</p></footer>
</main><script nonce="${nonce}">
const form=document.getElementById('deletion-form');
const result=document.getElementById('result');
const submit=document.getElementById('submit');
let busy=false;
form.addEventListener('submit',async(event)=>{
event.preventDefault();if(busy||!form.reportValidity())return;busy=true;submit.disabled=true;submit.textContent='Enviando solicitud…';result.textContent='';
const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
try{
const response=await fetch(window.location.pathname.replace(/\\/$/,'')+'/requests',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value.trim(),password:form.password.value,confirmation:'ELIMINAR'}),signal:controller.signal});
if(!response.ok){result.textContent=response.status===401?'No pudimos verificar tus datos. Revisa el correo y la contraseña.':response.status===429?'Hay demasiados intentos. Espera unos minutos antes de volver a intentar.':'No pudimos registrar la solicitud. Revisa tus datos e inténtalo de nuevo.';return;}
const body=await response.json();if(!body.request||typeof body.request.id!=='string'||body.request.status!=='pending')throw new Error('Respuesta no reconocida');
result.textContent='Solicitud recibida. Referencia: '+body.request.id+'. La cuenta todavía no se ha eliminado. El responsable de INHALEX atenderá tu solicitud. Si ya la habías enviado, conservamos la misma referencia.';form.reset();
}catch{result.textContent='No pudimos confirmar si se registró la solicitud. Puedes intentarlo de nuevo; se conserva una sola solicitud por cuenta. También puedes escribir al correo de contacto.';}
finally{clearTimeout(timer);form.password.value='';busy=false;submit.disabled=false;submit.textContent='Solicitar eliminación';result.focus();}
});
</script></body></html>`;
}
