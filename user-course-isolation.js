
(function(){
'use strict';
function clearPageInlineDisplay(){document.querySelectorAll('#mainApp .page').forEach(function(p){p.style.removeProperty('display')})}
function isolate(active){var course=document.getElementById('page-mycourses');if(course&&active!=='mycourses'){course.classList.remove('active');course.style.removeProperty('display')}}
function bind(){
 var item=document.querySelector('.menu-item[data-page="mycourses"]');if(item){item.setAttribute('onclick','return openMyCoursesPage(this,event)')}
 if(typeof showPage==='function'&&!window.__pspCourseIsolationWrapped){var old=showPage;window.showPage=function(page,el){clearPageInlineDisplay();var r=old.apply(this,arguments);clearPageInlineDisplay();isolate(page);return r};window.__pspCourseIsolationWrapped=true}
 var course=document.getElementById('page-mycourses');if(course&&!course.classList.contains('active'))course.style.removeProperty('display')
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();setTimeout(bind,500);
})();
