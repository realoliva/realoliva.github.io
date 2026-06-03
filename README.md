<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>你的名字 · 个人主页</title>
    <!-- 使用 Google Fonts 提升字体质感 -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,600;14..32,700&display=swap" rel="stylesheet">
    <!-- Font Awesome 6 (免费图标库) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #f5f7fe 0%, #e9eefa 100%);
            color: #1e293b;
            line-height: 1.5;
            padding: 2rem 1.5rem;
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
        }

        /* 卡片样式 */
        .card {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(2px);
            border-radius: 2rem;
            box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.1);
            padding: 2rem 1.8rem;
            margin-bottom: 2rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: 1px solid rgba(255,255,255,0.5);
        }

        .card:hover {
            transform: translateY(-3px);
            box-shadow: 0 25px 40px -14px rgba(0, 0, 0, 0.15);
        }

        /* 头部区域 */
        .profile-header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 2rem;
            margin-bottom: 1rem;
        }

        .avatar {
            width: 120px;
            height: 120px;
            background: linear-gradient(145deg, #3b82f6, #1e40af);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3.2rem;
            font-weight: 600;
            box-shadow: 0 12px 22px -8px rgba(59,130,246,0.4);
            transition: all 0.2s;
        }

        .title-area h1 {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(120deg, #1e293b, #2d3a5e);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            letter-spacing: -0.02em;
        }

        .title-area .tagline {
            font-size: 1.2rem;
            color: #475569;
            margin-top: 0.4rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            align-items: center;
        }

        .badge {
            background: #eef2ff;
            padding: 0.2rem 0.8rem;
            border-radius: 40px;
            font-size: 0.8rem;
            font-weight: 500;
            color: #2563eb;
        }

        /* 关于我 */
        .about-text {
            font-size: 1rem;
            color: #334155;
            margin: 1rem 0 0.8rem 0;
            background: #f8fafc;
            padding: 1rem 1.2rem;
            border-radius: 1.2rem;
            border-left: 4px solid #3b82f6;
        }

        /* 技术栈 badges */
        .skillset {
            display: flex;
            flex-wrap: wrap;
            gap: 0.7rem;
            margin: 1.2rem 0 0.5rem;
        }

        .skill {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 0.4rem 1rem;
            border-radius: 40px;
            font-size: 0.85rem;
            font-weight: 500;
            color: #1f2a48;
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .skill i {
            margin-right: 6px;
            color: #3b82f6;
        }

        .skill:hover {
            border-color: #3b82f6;
            background: #eff6ff;
            transform: scale(0.97);
        }

        /* 统计卡片双栏 */
        .stats-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            margin: 1.5rem 0 0.5rem;
        }

        .stats-card {
            flex: 1;
            background: #f1f5f9;
            border-radius: 1.2rem;
            padding: 1rem;
            text-align: center;
            transition: all 0.2s;
        }

        .stats-card img {
            max-width: 100%;
            border-radius: 0.8rem;
            background: #f8fafc;
        }

        /* 项目列表 */
        .project-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
        }

        .project-item {
            background: #f9fbfe;
            border-radius: 1.2rem;
            padding: 1rem 1.2rem;
            border: 1px solid #eef2ff;
            transition: 0.1s;
        }

        .project-item a {
            font-weight: 700;
            color: #2563eb;
            text-decoration: none;
            font-size: 1.1rem;
        }

        .project-item a:hover {
            text-decoration: underline;
        }

        .project-desc {
            color: #475569;
            margin-top: 0.3rem;
            font-size: 0.9rem;
        }

        /* 社交链接 */
        .social-links {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 1rem;
        }

        .social-btn {
            background: white;
            padding: 0.5rem 1.2rem;
            border-radius: 2rem;
            text-decoration: none;
            color: #1e293b;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #cbd5e1;
            transition: all 0.2s;
        }

        .social-btn i {
            font-size: 1.1rem;
        }

        .social-btn:hover {
            background: #0f172a;
            color: white;
            border-color: #0f172a;
            transform: translateY(-2px);
        }

        /* 页脚许可证 */
        .footer-note {
            text-align: center;
            font-size: 0.8rem;
            color: #5b6e8c;
            margin-top: 1.5rem;
            padding-top: 0.8rem;
            border-top: 1px solid rgba(0,0,0,0.05);
        }

        hr {
            margin: 1rem 0;
            border: none;
            height: 1px;
            background: linear-gradient(to right, #cbd5e1, transparent);
        }

        @media (max-width: 640px) {
            body {
                padding: 1rem;
            }
            .profile-header {
                flex-direction: column;
                text-align: center;
            }
            .title-area .tagline {
                justify-content: center;
            }
            .stats-row {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
<div class="container">
    <!-- 主要个人信息卡片 -->
    <div class="card">
        <div class="profile-header">
            <div class="avatar">
                <!-- 可以替换成你的头像emoji或首字母 -->
                <span>🐧</span>
            </div>
            <div class="title-area">
                <h1>林一·Dev</h1>
                <div class="tagline">
                    <span>✨ 全栈开发者 / 开源爱好者</span>
                    <span class="badge"><i class="fas fa-code"></i> 代码诗人</span>
                    <span class="badge"><i class="fas fa-coffee"></i> 咖啡驱动</span>
                </div>
            </div>
        </div>

        <div class="about-text">
            <i class="fas fa-quote-left" style="margin-right: 8px; color:#3b82f6;"></i> 
            嗨！我是热衷于构建优雅、高性能应用的开发者。喜欢探索新技术，贡献开源项目，并且坚信简洁的代码是最好的文档。
            目前在研究 <strong>Rust + WebAssembly</strong> 和 <strong>边缘计算</strong>。
        </div>

        <div class="skillset">
            <span class="skill"><i class="fab fa-python"></i> Python</span>
            <span class="skill"><i class="fab fa-js"></i> JavaScript/TS</span>
            <span class="skill"><i class="fab fa-react"></i> React</span>
            <span class="skill"><i class="fab fa-node-js"></i> Node.js</span>
            <span class="skill"><i class="fas fa-database"></i> PostgreSQL</span>
            <span class="skill"><i class="fab fa-git-alt"></i> Git/GitHub Actions</span>
            <span class="skill"><i class="fas fa-cloud"></i> Docker / K8s</span>
        </div>
    </div>

    <!-- GitHub 统计卡片 (使用 github-readme-stats) -->
    <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fab fa-github"></i> GitHub 洞察</h3>
        <div class="stats-row">
            <div class="stats-card">
                <img src="https://github-readme-stats.vercel.app/api?username=your-github-username&show_icons=true&theme=vue&hide_border=true&bg_color=ffffff00&icon_color=3b82f6&title_color=1e293b" alt="GitHub Stats" onerror="this.src='https://placehold.co/500x200?text=GitHub+Stats'">
                <small style="display: block; margin-top: 0.5rem;">⭐ 动态更新</small>
            </div>
            <div class="stats-card">
                <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=your-github-username&layout=compact&theme=vue&hide_border=true&bg_color=ffffff00&title_color=1e293b" alt="Top Langs" onerror="this.src='https://placehold.co/500x200?text=常用+语言'">
            </div>
        </div>
        <div style="font-size: 0.75rem; text-align: center; color: #5b6e8c; margin-top: 0.5rem;">
            <i class="fas fa-sync-alt"></i> 数据来自 GitHub API，请将用户名替换成你自己的真实 ID
        </div>
    </div>

    <!-- 热门项目展示 -->
    <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-rocket"></i> 近期项目</h3>
        <div class="project-list">
            <div class="project-item">
                <a href="#"><i class="fab fa-github"></i> 天气 CLI 助手</a>
                <div class="project-desc">🌦️ 一个用 Rust 编写的命令行工具，实时获取全球天气数据，支持城市模糊匹配。</div>
            </div>
            <div class="project-item">
                <a href="#"><i class="fab fa-react"></i> 任务管理面板</a>
                <div class="project-desc">📋 全栈项目：React + Tailwind + Node.js，实现看板视图与团队协作功能。</div>
            </div>
            <div class="project-item">
                <a href="#"><i class="fas fa-robot"></i> 智能文档解析器</a>
                <div class="project-desc">🧠 基于 Python 和 LLM API，将非结构化文档抽取为 JSON 知识库。</div>
            </div>
        </div>
        <div style="margin-top: 1rem;">
            <a href="https://github.com/your-github-username" style="color:#2563eb; font-weight:500;">👉 更多仓库 →</a>
        </div>
    </div>

    <!-- 联系 & 社交 -->
    <div class="card">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-paper-plane"></i> 找到我</h3>
        <div class="social-links">
            <a href="#" class="social-btn"><i class="fab fa-github"></i> GitHub</a>
            <a href="#" class="social-btn"><i class="fab fa-twitter"></i> Twitter</a>
            <a href="#" class="social-btn"><i class="fab fa-linkedin-in"></i> LinkedIn</a>
            <a href="#" class="social-btn"><i class="fas fa-envelope"></i> 邮件联系</a>
            <a href="#" class="social-btn"><i class="fas fa-blog"></i> 技术博客</a>
        </div>
        <hr>
        <div style="font-size: 0.9rem;">
            <i class="fas fa-envelope-open-text"></i> 开源合作或闲聊: <strong>lin.dev@example.com</strong>
        </div>
    </div>

    <!-- 许可证与版权说明（附加） -->
    <div class="footer-note">
        <i class="far fa-copyright"></i> 2025 林一·Dev | 本页面基于 MIT 许可证开源 · 代码和内容可自由复制修改
        <br>
        <span style="font-size: 0.7rem;">📄 完整许可证见仓库 LICENSE 文件（MIT）</span>
    </div>
</div>
</body>
</html>
