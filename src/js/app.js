document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    const navLinks = document.querySelectorAll('.sidebar ul li a');

    const routes = {
        '#welcome': `
            <div class="welcome-view">
                <h1>κύλημα</h1>
                <p>文字可以很美</p>
                <div class="welcome-buttons">
                    <a href="#themes" class="btn">选择模版</a>
                    <a href="#editor" class="btn">直接开始</a>
                </div>
            </div>
        `,
        '#editor': `
            <div class="editor-view">
                <div class="editor-actions">
                    <button id="import-md-btn" class="btn-primary">导入Markdown</button>
                    <button id="change-theme-btn" class="btn-primary">更换主题</button>
                    <button id="copy-wechat-btn" class="btn-accent">一键复制</button>
                </div>
                <div id="editor-container" style="height: calc(100vh - 120px);"></div>
            </div>
        `,
        '#icons': `
            <div class="icons-view">
                <div class="icons-main">
                    <h2>我的图标库</h2>
                    <div id="icons-grid" class="icons-grid">
                        <!-- Icons will be rendered here -->
                    </div>
                </div>
                <div class="icons-sidebar">
                    <h3>添加新图标</h3>
                    <form id="add-icon-form">
                        <div class="form-group">
                            <label for="icon-name">图标名称</label>
                            <input type="text" id="icon-name" name="icon-name" required>
                        </div>
                        <div class="form-group">
                            <label for="icon-svg">SVG 代码</label>
                            <textarea id="icon-svg" name="icon-svg" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn-primary btn-full">保存到图标库</button>
                    </form>
                    <div class="icon-resources">
                        <p>寻找灵感？试试这些免费图标库：</p>
                        <ul>
                            <li><a href="https://tabler-icons.io/" target="_blank">Tabler Icons</a></li>
                            <li><a href="https://lucide.dev/" target="_blank">Lucide</a></li>
                            <li><a href="https://heroicons.com/" target="_blank">Heroicons</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `,
        '#themes': `
            <div class="themes-view">
                <div class="themes-main">
                    <h2>我的主题库</h2>
                    <div class="themes-grid">
                        <!-- Theme cards will be rendered here -->
                    </div>
                </div>
                <div class="themes-sidebar">
                    <h2>创建新主题</h2>
                    <p>从这里开始，为您的新主题命名。</p>
                    <input type="text" id="new-theme-name" placeholder="我的新主题">
                    <button id="create-theme-btn" class="btn-primary btn-full">创建并编辑新主题</button>
                </div>
            </div>
        `,
        '#drafts': `
            <div class="drafts-view">
                <h2>草稿仓</h2>
                <p>这里存放着您所有未完成的作品。点击"载入"即可继续编辑。</p>
                <div id="drafts-list" class="item-list">
                    <!-- Drafts will be rendered here -->
                </div>
            </div>
        `,
        '#publish': `
            <div class="publish-view">
                <h2>发布仓</h2>
                <p>这里是您已完成的杰作。可以随时将它们移回草稿仓进行再次编辑。</p>
                <div id="publish-list" class="item-list">
                    <!-- Published articles will be rendered here -->
                </div>
            </div>
        `,
        '#theme-editor': `
            <div class="theme-editor-view">
                <h2>编辑主题</h2>
                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1;">
                        <form id="theme-editor-form">
                            <!-- Form content will be populated by JavaScript -->
                        </form>
                    </div>
                    <div style="flex: 1;">
                        <h3>预览</h3>
                        <div id="theme-preview-pane" style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                            <!-- Preview content will be populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>
        `,
    };

    let currentDraftId = window.draftService.getCurrentDraftId();

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function renderView(fullHash) {
        const hash = fullHash.split('?')[0];

        const view = routes[hash] || routes['#welcome'];
        appRoot.innerHTML = view;

        if (hash === '#editor') {
            const editorContainer = document.getElementById('editor-container');
            const activeTheme = window.themeService.getActiveTheme();
            
            const applyThemeToEditor = (container) => {
                const styles = Object.entries(activeTheme.styles)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('; ');
                container.setAttribute('style', styles);
            };

            const toolbarOptions = [
                ['bold', 'italic', 'underline', 'strike'],
                [{'header': 1}, {'header': 2}],
                ['blockquote', 'code-block', {'list': 'ordered'}, {'list': 'bullet'}],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image', 'insertIcon'],
                ['clean']
            ];

            // Apply theme before initializing Quill
            applyThemeToEditor(editorContainer);

            const quill = new Quill('#editor-container', {
                modules: {toolbar: toolbarOptions},
                theme: 'snow'
            });

            if (!currentDraftId) {
                const newDraft = window.draftService.createDraft('');
                currentDraftId = newDraft.id;
                window.draftService.setCurrentDraftId(currentDraftId);
            }

            const draft = window.draftService.getDraft(currentDraftId);
            if (draft && draft.content) {
                quill.root.innerHTML = draft.content;
            }

            const autoSave = debounce((content) => {
                const current = window.draftService.getDraft(currentDraftId);
                const draftToSave = {
                    ...current,
                    title: content.substring(0, 30).replace(/<[^>]+>/g, ' ').trim() || '无标题草稿',
                    content: content,
                    updatedAt: new Date().toISOString()
                };
                window.draftService.saveDraft(draftToSave);
                console.log("Draft saved!");
            }, 2000);

            quill.on('text-change', () => {
                const content = quill.root.innerHTML;
                autoSave(content);
            });
            
            quill.getModule('toolbar').addHandler('insertIcon', () => {
                openIconModal(quill);
            });

            // Set custom icon for the toolbar button
            const insertIconBtn = document.querySelector('.ql-insertIcon');
            if(insertIconBtn){
                insertIconBtn.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M5,19V5h14v14H5z"/><path fill="currentColor" d="M10.2,14.4l-1.8-1.8L6,15l4.2,4.2l6-6l-2.4-2.4L10.2,14.4z"/></svg>`;
            }

            // Add event listeners for new buttons
            document.getElementById('import-md-btn').addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.md, .markdown';

                fileInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        let markdownText = e.target.result;
                        // Remove redundant blank lines
                        markdownText = markdownText.replace(/(\n\s*){2,}/g, '\n\n');
                        
                        const converter = new showdown.Converter();
                        const html = converter.makeHtml(markdownText);
                        quill.root.innerHTML = html;
                    };
                    reader.onerror = () => {
                        alert('读取文件时出错！');
                    };
                    reader.readAsText(file);
                });

                fileInput.click();
            });

            document.getElementById('change-theme-btn').addEventListener('click', () => {
                window.location.hash = '#themes';
            });

            document.getElementById('copy-wechat-btn').addEventListener('click', () => {
                const activeTheme = window.themeService.getActiveTheme();
                const styles = activeTheme.styles;
                
                // Create a temporary container to process the HTML
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = quill.root.innerHTML;

                // Apply styles inline
                tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                    el.style.color = styles['--h1-color'];
                });
                tempContainer.querySelectorAll('p').forEach(el => {
                    el.style.color = styles['--p-color'];
                });
                tempContainer.querySelectorAll('a').forEach(el => {
                    el.style.color = styles['--a-color'];
                });
                // You can expand this to include more styles like font-size, margin, etc.

                let finalHtml = tempContainer.innerHTML;

                // Replace icon placeholders with actual SVG code
                const icons = window.iconService.getIcons();
                finalHtml = finalHtml.replace(/\[icon:([^\]]+)\]/g, (match, iconName) => {
                    const icon = icons.find(i => i.name === iconName.trim());
                    if (!icon) return match;
                    
                    if (icon.color) {
                        // Inject color into SVG style
                        return icon.svg.replace(/<svg/i, `<svg style="color: ${icon.color};"`);
                    }
                    return icon.svg;
                });

                // Copy to clipboard
                navigator.clipboard.writeText(finalHtml).then(() => {
                    alert('已成功复制到剪贴板！现在可以粘贴到微信编辑器中了。');
                }).catch(err => {
                    console.error('复制失败: ', err);
                    alert('复制失败，请检查浏览器权限或手动复制。');
                });
            });

        } else if (hash === '#icons') {
            renderIconsView();
        } else if (hash === '#themes') {
            renderThemeCards();
            
            // Add debug logging
            console.log('Setting up theme creation button...');
            const createBtn = document.getElementById('create-theme-btn');
            console.log('Create button found:', createBtn);
            
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    console.log('Create button clicked!');
                    const themeNameInput = document.getElementById('new-theme-name');
                    console.log('Theme name input found:', themeNameInput);
                    
                    if (themeNameInput) {
                        const newThemeName = themeNameInput.value.trim();
                        console.log('Theme name:', newThemeName);
                        
                        if (newThemeName) {
                            console.log('Creating new theme...');
                            try {
                                const newTheme = window.themeService.addTheme(newThemeName);
                                console.log('New theme created:', newTheme);
                                themeNameInput.value = ''; // Clear input
                                window.location.hash = `#theme-editor?id=${newTheme.id}`;
                            } catch (error) {
                                console.error('Error creating theme:', error);
                                alert('创建主题时出错：' + error.message);
                            }
                        } else {
                            alert('请输入主题名称！');
                        }
                    } else {
                        console.error('Theme name input not found!');
                    }
                });
            } else {
                console.error('Create theme button not found!');
            }
        } else if (hash === '#drafts') {
            renderDraftsView();
        } else if (hash === '#publish') {
            renderPublishView();
        } else if (hash === '#theme-editor') {
            const urlParams = new URLSearchParams(fullHash.split('?')[1]);
            const themeId = urlParams.get('id');
            
            let theme = window.themeService.getTheme(themeId);

            if (!theme) {
                alert('主题未找到!');
                window.location.hash = '#themes';
                return;
            }
            
            // Set up the theme editor interface
            appRoot.innerHTML = `
                <div class="theme-editor-view">
                    <h2>编辑主题: ${theme.name}</h2>
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1;">
                            <form id="theme-editor-form">
                                <!-- Form will be populated by JavaScript -->
                            </form>
                        </div>
                        <div style="flex: 1;">
                            <h3>预览</h3>
                            <div id="theme-preview-pane" style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                                <!-- Preview will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const formContainer = document.getElementById('theme-editor-form');
            const previewPane = document.getElementById('theme-preview-pane');

            function renderPreview() {
                const styles = Object.entries(theme.styles)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('; ');
                previewPane.setAttribute('style', styles);
                
                previewPane.innerHTML = `
                    <h1>这是标题样式</h1>
                    <p>这是正文段落的样式预览。您可以在这里看到字体颜色、段落间距等效果。</p>
                    <p>这段包含<a href="#">链接样式</a>的文字，可以看到链接的颜色效果。</p>
                    <blockquote>这是引用块的样式预览，可以看到背景色效果。</blockquote>
                `;
            }

            function renderForm() {
                formContainer.innerHTML = `
                    <div class="form-group">
                        <label for="theme-name">主题名称</label>
                        <input type="text" id="theme-name" value="${theme.name}">
                    </div>
                    
                    <h4>标题样式</h4>
                    <div class="form-group">
                        <label for="h1-color">标题颜色</label>
                        <input type="color" id="h1-color" value="${theme.styles['--h1-color'] || '#001449'}">
                    </div>
                    
                    <h4>正文样式</h4>
                    <div class="form-group">
                        <label for="p-color">正文颜色</label>
                        <input type="color" id="p-color" value="${theme.styles['--p-color'] || '#374151'}">
                    </div>
                    <div class="form-group">
                        <label for="p-margin-bottom">段落间距</label>
                        <input type="text" id="p-margin-bottom" value="${theme.styles['--p-margin-bottom'] || '16px'}">
                    </div>
                    
                    <h4>其他元素</h4>
                    <div class="form-group">
                        <label for="a-color">链接颜色</label>
                        <input type="color" id="a-color" value="${theme.styles['--a-color'] || '#001449'}">
                    </div>
                    <div class="form-group">
                        <label for="blockquote-bg">引用背景色</label>
                        <input type="color" id="blockquote-bg" value="${theme.styles['--blockquote-bg'] || '#F8F9FA'}">
                    </div>
                    
                    <div class="form-group">
                        <button type="button" onclick="window.location.hash='#themes'" class="btn-secondary">返回主题库</button>
                    </div>
                `;

                // Add event listeners
                document.getElementById('theme-name').addEventListener('input', (e) => {
                    theme.name = e.target.value;
                    window.themeService.updateTheme(theme);
                });
                
                ['h1-color', 'p-color', 'p-margin-bottom', 'a-color', 'blockquote-bg'].forEach(id => {
                    const inputElement = document.getElementById(id);
                    const eventType = inputElement.type === 'color' ? 'input' : 'change';
                    
                    inputElement.addEventListener(eventType, (e) => {
                        const styleKey = `--${id}`;
                        theme.styles[styleKey] = e.target.value;
                        renderPreview();
                        window.themeService.updateTheme(theme);
                    });
                });
            }
            
            renderForm();
            renderPreview();
        }
    }

    function renderIconsView() {
        const icons = window.iconService.getIcons();
        const gridContainer = document.getElementById('icons-grid');
        gridContainer.innerHTML = icons.map(icon => `
            <div class="icon-card" data-icon-id="${icon.id}">
                <div class="icon-preview">${icon.svg}</div>
                <p class="icon-name">${icon.name}</p>
                <div class="icon-actions">
                    <button class="btn-secondary copy-svg-btn">复制</button>
                    <button class="btn-primary delete-icon-btn-new">删除</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.copy-svg-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const iconId = e.target.closest('.icon-card').dataset.iconId;
                const icon = window.iconService.getIcon(iconId);
                if (icon) {
                    navigator.clipboard.writeText(icon.svg).then(() => {
                        alert(`已复制图标 "${icon.name}" 的 SVG 代码！`);
                    }).catch(err => {
                        console.error('复制 SVG 失败: ', err);
                        alert('复制失败！');
                    });
                }
            });
        });

        document.querySelectorAll('.delete-icon-btn-new').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const iconId = e.target.closest('.icon-card').dataset.iconId;
                if (confirm('确定要删除这个图标吗？')) {
                    window.iconService.deleteIcon(iconId);
                    renderIconsView();
                }
            });
        });

        const addIconForm = document.getElementById('add-icon-form');
        addIconForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('icon-name');
            const svgInput = document.getElementById('icon-svg');
            const name = nameInput.value.trim();
            const svg = svgInput.value.trim();
            
            if (name && svg) {
                window.iconService.addIcon(name, svg);
                renderIconsView();
                nameInput.value = '';
                svgInput.value = '';
            } else {
                alert('请填写图标名称和 SVG 代码。');
            }
        });
    }

    function renderDraftsView() {
        const drafts = window.draftService.getDrafts().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const listContainer = document.getElementById('drafts-list');
        
        document.querySelector('.drafts-view h2').textContent = `草稿仓 (${drafts.length})`;

        if (drafts.length === 0) {
            listContainer.innerHTML = `<p>空空如也，快去创作吧！</p>`;
            return;
        }

        listContainer.innerHTML = drafts.map(draft => `
            <div class="list-item" data-draft-id="${draft.id}">
                <div class="item-info">
                    <h3 class="item-title">${draft.title}</h3>
                    <p class="item-meta">最后更新于: ${new Date(draft.updatedAt).toLocaleString()}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary load-draft-btn">载入</button>
                    <button class="btn-primary publish-draft-btn">发布</button>
                    <button class="btn-danger delete-draft-btn">删除</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.load-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                window.draftService.setCurrentDraftId(draftId);
                currentDraftId = draftId; // Update global currentDraftId
                window.location.hash = '#editor';
            });
        });

        document.querySelectorAll('.publish-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                const draft = window.draftService.getDraft(draftId);
                if (draft) {
                    window.publishService.addPublished(draft);
                    window.draftService.deleteDraft(draftId);
                    renderDraftsView(); // Refresh drafts list
                }
            });
        });

        document.querySelectorAll('.delete-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                if (confirm('确定要删除这篇草稿吗？此操作不可撤销。')) {
                    window.draftService.deleteDraft(draftId);
                    renderDraftsView(); // Re-render the list
                }
            });
        });
    }

    function renderPublishView() {
        const publishedArticles = window.publishService.getPublished().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const listContainer = document.getElementById('publish-list');

        document.querySelector('.publish-view h2').textContent = `发布仓 (${publishedArticles.length})`;

        if (publishedArticles.length === 0) {
            listContainer.innerHTML = `<p>这里还没有已发布的文章。</p>`;
            return;
        }

        listContainer.innerHTML = publishedArticles.map(article => `
             <div class="list-item" data-article-id="${article.id}">
                <div class="item-info">
                    <h3 class="item-title">${article.title}</h3>
                    <p class="item-meta">发布于: ${new Date(article.updatedAt).toLocaleString()}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary re-edit-btn">重新编辑</button>
                    <button class="btn-danger delete-published-btn">删除</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.re-edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const articleId = e.target.closest('.list-item').dataset.articleId;
                const article = window.publishService.getPublished().find(a => a.id === articleId);
                if (article) {
                    window.draftService.saveDraft(article); // Move back to drafts
                    window.publishService.deletePublished(articleId);
                    renderPublishView();
                }
            });
        });
        
        document.querySelectorAll('.delete-published-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const articleId = e.target.closest('.list-item').dataset.articleId;
                if (confirm('确定要删除这篇已发布的文章吗？')) {
                    window.publishService.deletePublished(articleId);
                    renderPublishView();
                }
            });
        });
    }

    function renderThemeCards() {
        const themes = window.themeService.getThemes();
        const grid = document.querySelector('.themes-grid');
        grid.innerHTML = themes.map(theme => {
            const styles = Object.entries(theme.styles)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
            return `
            <div class="theme-card" data-theme-id="${theme.id}" style="${styles}">
                <h3>${theme.name}</h3>
                <div class="theme-preview">
                    <h1>文章标题</h1>
                    <p>这是一段正文预览。</p>
                    <a href="#">这是一个链接</a>
                </div>
                <div class="theme-actions">
                    <button class="btn-primary start-btn">开始</button>
                    <button class="edit-btn">编辑</button>
                </div>
            </div>
        `}).join('');

        // Add event listeners for the new buttons
        document.querySelectorAll('.start-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const themeId = e.target.closest('.theme-card').dataset.themeId;
                window.themeService.setActiveTheme(themeId);
                window.location.hash = '#editor';
            });
        });
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const themeId = e.target.closest('.theme-card').dataset.themeId;
                console.log('Editing theme ID:', themeId);
                window.location.hash = `#theme-editor?id=${themeId}`;
            });
        });
    }

    function updateActiveLink(hash) {
        navLinks.forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function handleRouteChange() {
        const fullHash = window.location.hash || '#welcome';
        const hash = fullHash.split('?')[0]; // Get the base route, e.g., '#theme-editor'
        renderView(fullHash); // Pass the full hash to renderView
        updateActiveLink(hash); // Use the base route for the active link
    }

    window.addEventListener('hashchange', handleRouteChange);

    // Initial load
    handleRouteChange();

    function openIconModal(quill) {
        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">选择一个图标</h3>
                <div id="modal-icons-grid" class="icons-grid">
                    <!-- Icons will be loaded here -->
                </div>
                <button class="modal-close-btn">&times;</button>
            </div>
        `;
        document.body.appendChild(modal);

        const icons = window.iconService.getIcons();
        const grid = modal.querySelector('#modal-icons-grid');
        grid.innerHTML = icons.map(icon => `
            <div class="icon-card" data-icon-name="${icon.name}">
                <div class="icon-preview">${icon.svg}</div>
            </div>
        `).join('');

        grid.querySelectorAll('.icon-card').forEach(card => {
            card.addEventListener('click', () => {
                const iconName = card.dataset.iconName;
                const range = quill.getSelection(true);
                quill.insertText(range.index, `[icon:${iconName}]`);
                document.body.removeChild(modal);
            });
        });

        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
}); 