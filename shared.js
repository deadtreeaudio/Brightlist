'use strict';
// Cloud lists are separate from local/private lists. No private list is ever uploaded automatically.
(() => {
  const url = window.BRIGHTLIST_SUPABASE_URL;
  const key = window.BRIGHTLIST_SUPABASE_ANON_KEY;
  const cloudReady = !!(url && key && window.supabase);
  const cloud = cloudReady ? window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
  let user = null, myLists = [], currentList = null, sharedItems = [], channel = null;
  let loading = false;
  let displayName = localStorage.getItem("brightlist_display_name") || "";
  const memberNames = {};
  const personalTitle = () => displayName ? `${displayName}’s lists` : "My lists";
  const prettyList = l => { const names=memberNames[l.id]||[]; return names.length ? `${names.join(names.length===2?" and ":", ")}’s ${l.title}` : l.title; };
  async function getNames(id){const {data,error}=await cloud.rpc("list_member_names",{p_list_id:id});if(!error)memberNames[id]=data||[];}
  async function saveName(name){name=name.trim().slice(0,60);if(!name)return; const {error}=await cloud.from("profiles").upsert({id:user.id,display_name:name});if(error)throw error;displayName=name;localStorage.setItem("brightlist_display_name",name);await refresh();render();}
  async function loadName(){if(!user)return;const {data}=await cloud.from("profiles").select("display_name").eq("id",user.id).maybeSingle();displayName=data?.display_name||"";localStorage.setItem("brightlist_display_name",displayName);}

  const originalNav = renderNav, originalRender = render;
  const originalListView = listView;
  listView = function(target){ originalListView(target); if(displayName){const h=$("view").querySelector(".page-heading h1");if(h&&target.type!=="category")h.innerHTML=safe(`${displayName}’s ${target.type==='todo'?'To-Do List':target.type==='remember'?'Things to Remember':target.name}`)+`<span style="color:#aac82c">.</span>`;} };
  const safe = esc;
  const params = new URLSearchParams(location.search);
  let invite = params.get('join');
  function busy(message) { $('view').innerHTML = `<div class="shared-panel"><p>${safe(message)}</p></div>`; }
  renderNav = function () {
    originalNav();
    document.querySelector(".sidebar-footer p").textContent=personalTitle();
    $('navigation').insertAdjacentHTML('beforeend',`<div class="nav-subhead">TOGETHER</div><button class="nav-entry ${route.startsWith('shared')?'active':''}" data-route="shared"><span class="nav-ico">⇄</span>Shared lists<span class="count">${myLists.length}</span></button>`);
    $('mobileNavigation').insertAdjacentHTML('beforeend',`<button class="${route.startsWith('shared')?'active':''}" data-route="shared"><span>⇄</span>Shared</button>`);
  };
  render = function () {
    if (route.startsWith('shared')) { renderNav(); showShared(); }
    else originalRender();
  };
  const message = (e) => {notify(e?.message || String(e));};
  async function initialize() {
    if (!cloud) return;
    const {data:{session}} = await cloud.auth.getSession();
    user=session?.user||null;
    cloud.auth.onAuthStateChange((_evt,session)=>{user=session?.user||null; setTimeout(async()=>{await loadName();await refresh();if(route.startsWith('shared'))render();},0)});
    await loadName();await refresh();
    if (invite) {route='shared';render();if(user)await joinInvite();}
    else if(route==='shared')render();
  }
  async function refresh() {
    if (!user||!cloud) {myLists=[];return;}
    const {data,error}=await cloud.from('shared_lists').select('id,title,owner_id,created_at').order('created_at',{ascending:false});
    if(error)message(error);else {myLists=data||[];await Promise.all(myLists.map(l=>getNames(l.id)));}
  }
  function showShared() {
    if(!cloudReady){$('view').innerHTML=`<div class="page-heading"><div class="eyebrow">COLLABORATION</div><h1>${safe(personalTitle())} · Shared<span style="color:#aac82c">.</span></h1><p>Private lists are still saved only on this device.</p></div><div class="card shared-panel"><h2>Cloud setup required</h2><p>Shared lists need a free Supabase project. Deploy the database setup in <code>supabase-setup.sql</code> and add your project URL and public anon key to <code>cloud-config.js</code>. See README.</p><p>Until configured, personal lists work normally and remain private.</p></div>`;return;}
    if(!user){$('view').innerHTML=`<div class="page-heading"><div class="eyebrow">COLLABORATION</div><h1>${safe(personalTitle())} · Shared<span style="color:#aac82c">.</span></h1><p>Sign in to collaborate. Your existing private lists stay on this device.</p></div><div class="card shared-panel"><h2>Sign in using email</h2><p>We'll email you a sign-in link. No password needed.</p><form id="cloudSignIn"><label class="field">Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><button class="primary">Send sign-in link</button></form>${invite?'<p>Your invitation will be ready after you sign in.</p>':''}</div>`;return;}
    if(!displayName){$('view').innerHTML=`<div class="card shared-panel"><h2>Welcome! What should we call you?</h2><p>Your name will appear on your personal dashboard and on lists you share.</p><form id="cloudProfile"><label class="field">Display name<input name="name" maxlength="60" required placeholder="e.g. Clint"></label><button class="primary">Continue</button></form></div>`;return;}
    if(route.startsWith('shared:')){showDetail();return;}
    $('view').innerHTML=`<div class="heading-row"><div class="page-heading"><div class="eyebrow">COLLABORATE</div><h1>${safe(personalTitle())} · Shared<span style="color:#aac82c">.</span></h1><p>Only invited members can view or edit each list.</p></div><button class="primary" data-cloud="new">＋ New shared list</button></div><div class="card shared-panel"><p>Signed in as <strong>${safe(displayName||user.email)}</strong> <button class="secondary" data-cloud="profile">Edit name</button> <button class="secondary" data-cloud="signout">Sign out</button></p>${invite?'<button class="primary" data-cloud="join">Accept invitation</button>':''}<div class="section-row"><h2>Lists you share</h2></div>${myLists.length?myLists.map(l=>`<div class="item"><div class="item-content"><strong>${safe(prettyList(l))}</strong><div class="item-meta">${l.owner_id===user.id?'Created by you':'Shared with you'}</div></div><button class="secondary" data-route="shared:${safe(l.id)}">Open →</button></div>`).join(''):'<div class="empty">No shared lists yet. Create one or open an invitation link.</div>'}</div>`;
  }
  function showDetail(){const l=myLists.find(l=>`shared:${l.id}`===route);if(!l){route='shared';showShared();return;}currentList=l;let done=sharedItems.filter(i=>i.done).length;$('view').innerHTML=`<button class="back" data-route="shared">← Shared lists</button><div class="heading-row"><div class="page-heading"><div class="eyebrow">SHARED WITH INVITED PEOPLE</div><h1>${safe(prettyList(l))}<span style="color:#aac82c">.</span></h1><p>Updates sync between members while connected to the internet.</p></div><div class="toolbar"><button class="secondary" data-cloud="invite">Share invite link</button><button class="secondary" data-cloud="members">Members</button><button class="secondary" data-cloud="rename">Rename</button></div></div>${stats(sharedItems)}<div class="card"><form class="quick-entry" id="sharedAdd"><input name="text" maxlength="180" autocomplete="off" required placeholder="Add an item to this shared list…"><button class="primary">＋ Add</button></form><div class="items">${sharedItems.length?sharedItems.map(i=>`<div class="item ${i.done?'done':''}"><button class="check ${i.done?'checked':''}" data-cloud="toggle" data-id="${safe(i.id)}" aria-label="Toggle ${safe(i.text)}">${i.done?'✓':''}</button><div class="item-content"><div class="item-name">${safe(i.text)}</div>${i.person?`<div class="item-meta">↪ Return to ${safe(i.person)}</div>`:''}</div><div class="item-actions"><button data-cloud="edit" data-id="${safe(i.id)}" aria-label="Edit">✎</button><button data-cloud="delete" data-id="${safe(i.id)}" aria-label="Delete">×</button></div></div>`).join(''):'<div class="empty">This list is empty. Add an item above.</div>'}</div></div><div class="footer-actions"><button class="secondary" data-cloud="reset">Uncheck all</button><button class="secondary danger" data-cloud="leave">${l.owner_id===user.id?'Delete shared list':'Leave shared list'}</button></div>`;}
  async function loadItems(listId){if(channel){await cloud.removeChannel(channel);channel=null;}sharedItems=[];const {data,error}=await cloud.from('shared_items').select('id,text,person,done,created_at').eq('list_id',listId).order('created_at');if(error){message(error);return;}sharedItems=data||[];if(route===`shared:${listId}`)render();channel=cloud.channel('items-'+listId).on('postgres_changes',{event:'*',schema:'public',table:'shared_items',filter:`list_id=eq.${listId}`},async()=>{if(route===`shared:${listId}`){const r=await cloud.from('shared_items').select('id,text,person,done,created_at').eq('list_id',listId).order('created_at');if(!r.error){sharedItems=r.data||[];render();}}}).subscribe();}
  async function openList(id){route='shared:'+id;render();await loadItems(id);}
  async function joinInvite(){if(!user||!invite)return;const {data,error}=await cloud.rpc('join_shared_list',{p_token:invite});if(error){message(error);return;}invite=null;history.replaceState({},'',location.pathname);await refresh();if(data)await openList(data);else{route='shared';render();}}
  async function mutation(q){const {error}=await q;if(error)message(error);else if(currentList&&route===`shared:${currentList.id}`)await loadItems(currentList.id);}
  async function handle(action,id){if(loading)return;loading=true;try{
    if(action==='signout'){await cloud.auth.signOut();currentList=null;sharedItems=[];route='shared';render();return;}
    if(action==='join'){await joinInvite();return;}
    if(action==='profile'){const name=prompt('What name should appear on your lists?',displayName||'');if(name?.trim())await saveName(name);return;}
    if(action==='new'){const title=prompt('Name your new shared list:','Trip packing');if(!title?.trim())return;if(!displayName){const name=prompt("Your display name (e.g. Clint):", "");if(!name?.trim())return;await saveName(name);}const {data,error}=await cloud.from('shared_lists').insert({title:title.trim().slice(0,100),owner_id:user.id}).select('id').single();if(error)throw error;await refresh();await openList(data.id);return;}
    const l=currentList;if(!l)return;
    if(action==='toggle'){const item=sharedItems.find(x=>x.id===id);if(item)await mutation(cloud.from('shared_items').update({done:!item.done}).eq('id',id).eq('list_id',l.id));}
    if(action==='delete'){if(confirm('Delete this item for everyone?'))await mutation(cloud.from('shared_items').delete().eq('id',id).eq('list_id',l.id));}
    if(action==='edit'){const item=sharedItems.find(x=>x.id===id);if(!item)return;const newText=prompt('Edit item:',item.text);if(newText===null||!newText.trim())return;const person=prompt('Return to (optional):',item.person||'');if(person===null)return;await mutation(cloud.from('shared_items').update({text:newText.trim().slice(0,180),person:person.trim().slice(0,100)}).eq('id',id).eq('list_id',l.id));}
    if(action==='reset'){if(confirm('Uncheck every item in this shared list?'))await mutation(cloud.from('shared_items').update({done:false}).eq('list_id',l.id));}
    if(action==='invite'){const {data,error}=await cloud.rpc('create_share_link',{p_list_id:l.id});if(error)throw error;const link=`${location.origin}${location.pathname}?join=${encodeURIComponent(data)}`;if(navigator.share){try{await navigator.share({title:`Join my Brightlist: ${l.title}`,url:link});return;}catch(e){if(e.name==='AbortError')return;}}
      try{await navigator.clipboard.writeText(link);notify('Invite link copied')}catch(e){prompt('Copy this invite link:',link)}return;}
    if(action==='members'){const {data,error}=await cloud.from('shared_members').select('user_id,joined_at').eq('list_id',l.id);if(error)throw error;alert(`Members: ${(memberNames[l.id]||[]).join(", ") || data.length}\n\nTo revoke an invitation link, regenerate it by using the option in Supabase or remove the list. Member-management controls can be added later.`);return;}
    if(action==='rename'){const name=prompt('List name:',l.title);if(!name?.trim())return;const {error}=await cloud.from('shared_lists').update({title:name.trim().slice(0,100)}).eq('id',l.id);if(error)throw error;await refresh();render();return;}
    if(action==='leave'){const owner=l.owner_id===user.id;if(!confirm(owner?'Delete this shared list and all its items for EVERYONE?':'Leave this list? You will lose access.'))return;const {error}=owner?await cloud.from('shared_lists').delete().eq('id',l.id):await cloud.from('shared_members').delete().eq('list_id',l.id).eq('user_id',user.id);if(error)throw error;await refresh();currentList=null;sharedItems=[];route='shared';render();return;}
  }catch(e){message(e)}finally{loading=false;}}
  document.addEventListener('click',e=>{const r=e.target.closest('[data-route]');if(r&&r.dataset.route.startsWith('shared:')){e.preventDefault();e.stopImmediatePropagation();openList(r.dataset.route.slice(7));return;}if(r&&r.dataset.route==='shared'){e.preventDefault();e.stopImmediatePropagation();route='shared';render();return;}const a=e.target.closest('[data-cloud]');if(a){e.preventDefault();e.stopImmediatePropagation();handle(a.dataset.cloud,a.dataset.id);}},true);
  document.addEventListener('submit',async e=>{if(e.target.id==='cloudProfile'){e.preventDefault();e.stopImmediatePropagation();try{await saveName(e.target.elements.name.value)}catch(err){message(err)}}else if(e.target.id==='cloudSignIn'){e.preventDefault();e.stopImmediatePropagation();const email=e.target.elements.email.value.trim();const redirectTo=location.origin+location.pathname+(invite?'?join='+encodeURIComponent(invite):'');const {error}=await cloud.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});if(error)message(error);else notify('Check your email for your sign-in link.');}else if(e.target.id==='sharedAdd'){e.preventDefault();e.stopImmediatePropagation();const text=e.target.elements.text.value.trim();if(!text||!currentList)return;const {error}=await cloud.from('shared_items').insert({list_id:currentList.id,text:text.slice(0,180),created_by:user.id});if(error)message(error);else{e.target.reset();await loadItems(currentList.id);}}},true);
  initialize().catch(message);
})();
