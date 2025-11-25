const API = '/api/ubicaciones';
const tbody = document.getElementById('tbody');
const btnNueva = document.getElementById('btnNueva');
const modal = new bootstrap.Modal(document.getElementById('modal'));
const $ = (id)=>document.getElementById(id);

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const bg = type==='success'?'bg-success':type==='error'?'bg-danger':'bg-info';
  const el = document.createElement('div');
  el.className = `toast align-items-center text-white ${bg} border-0`;
  el.role='alert'; el.ariaLive='assertive'; el.ariaAtomic='true';
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(el); const t=new bootstrap.Toast(el,{delay:2800}); t.show();
  el.addEventListener('hidden.bs.toast', ()=>el.remove());
}

async function fetchJSON(url, opts){ const r=await fetch(url,opts); if(!r.ok) throw new Error(await r.text()); return r.json(); }

async function listar(){
  try {
    const data = await fetchJSON(API);
    const userResponse = await fetchJSON('/api/user'); // Obtén el rol del servidor
    const isAdmin = userResponse.rol === 'admin';
    console.log('Rol del usuario:', userResponse.rol, 'isAdmin:', isAdmin);
    
    tbody.innerHTML = '';
    data.forEach(u=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td><td>${u.identificacion}</td><td>${u.sede}</td><td>${u.edificio}</td><td>${u.piso}</td><td>${u.sala}</td>
        <td>${u.createdAt||''}</td><td>${u.updatedAt||''}</td>
        <td>
          ${isAdmin ? `
            <button class="btn btn-sm btn-warning me-2" data-act="edit" data-id="${u.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-act="del" data-id="${u.id}">Eliminar</button>
          ` : `<span class="text-muted small">Solo lectura</span>`}
        </td>`;
      tbody.appendChild(tr);
    });
  } catch(error) {
    console.error('Error en listar:', error);
    showToast('Error al listar ubicaciones','error');
  }
}

btnNueva.addEventListener('click', ()=>{
  $('title').textContent='Nueva ubicación';
  $('id').value=''; $('identificacion').value=''; $('sede').value=''; $('edificio').value=''; $('piso').value=''; $('sala').value='';
  modal.show();
});

tbody.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button'); if(!btn) return;
  const {act,id} = btn.dataset;
  if (act==='edit'){
    const items = await fetchJSON(API);
    const u = items.find(x=>x.id==id); if(!u) return showToast('No encontrado','error');
    $('title').textContent = `Editar ubicación #${id}`;
    $('id').value=id; $('identificacion').value=u.identificacion; $('sede').value=u.sede; $('edificio').value=u.edificio; $('piso').value=u.piso; $('sala').value=u.sala;
    modal.show();
  } else if (act==='del'){
    if(!confirm('¿Eliminar ubicación?')) return;
    try { await fetchJSON(`${API}/${id}`, { method:'DELETE' }); await listar(); showToast('Ubicación eliminada','info'); }
    catch(e){ showToast('No se pudo eliminar (quizá tiene equipos)','error'); }
  }
});

document.getElementById('form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const payload = {
    identificacion: $('identificacion').value.trim(),
    sede: $('sede').value.trim(),
    edificio: $('edificio').value.trim(),
    piso: $('piso').value.trim(),
    sala: $('sala').value.trim()
  };
  const id = $('id').value;
  try{
    if (id) await fetchJSON(`${API}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    else     await fetchJSON(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    modal.hide(); await listar(); showToast(id?'Ubicación actualizada':'Ubicación creada');
  }catch(e){ showToast('Error al guardar','error'); }
});

listar().catch(()=>showToast('Error al listar','error'));