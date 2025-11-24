// Blog posts data - update this array when adding new posts
const blogPosts = [
	{
		title: 'What's New in Microsoft Intune – Microsoft Ignite 2025',
		url: '/blog/msignite-2025-whats-new-intune.html',
		date: '2025-11-24'
	},
	{
		title: 'Microsoft Ignite 2025 – Key Announcements by Technical Area',
		url: '/blog/msignite-2025-key-announcements.html',
		date: '2025-11-21'
	},
	{
		title: 'Microsoft Ignite 2025 – Virtual Attendance Schedule',
		url: '/blog/msignite-2025-favorites-biglist.html',
		date: '2025-11-16'
	},
	{
		title: 'The Practical Modernization of Configuration Manager',
		url: '/blog/practical-modernization-configmgr.html',
		date: '2025-11-14'
	},
	{
		title: 'ConfigMgr Abbreviations & Acronyms',
		url: '/blog/configmgr-abbreviations-acronyms.html',
		date: '2025-11-14'
	}
];

// Generate sidebar HTML
function generateBlogSidebar() {
	const currentPath = window.location.pathname;
	const sidebar = document.querySelector('.blog-sidebar');
	
	if (!sidebar) return;
	
	let html = `
		<h4 style="margin:0 0 16px; font-size:14px; text-transform:uppercase; color:var(--muted)">All Posts</h4>
		<nav class="blog-nav">
			<a href="/blog.html" style="display:block; margin-bottom:12px; font-size:14px">← Back to Blog</a>
			<div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border)">
	`;
	
	blogPosts.forEach(post => {
		const isCurrentPage = currentPath === post.url;
		const color = isCurrentPage ? 'var(--brand)' : 'var(--muted)';
		html += `<a href="${post.url}" style="display:block; margin-bottom:8px; font-size:13px; color:${color}">${post.title}</a>\n`;
	});
	
	html += `
			</div>
		</nav>
	`;
	
	sidebar.innerHTML = html;
}

// Run on page load
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', generateBlogSidebar);
} else {
	generateBlogSidebar();
}
