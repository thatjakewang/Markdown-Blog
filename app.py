from flask import Flask, render_template, url_for # 1. 這裡補上了 url_for
from flask_flatpages import FlatPages
from datetime import datetime
from flask import request
from flask import jsonify

app = Flask(__name__)

app.config['FLATPAGES_EXTENSION'] = '.md'
app.config['FLATPAGES_ROOT'] = 'posts'
app.config['FLATPAGES_MARKDOWN_EXTENSIONS'] = [
    'fenced_code',
    'codehilite',
]
pages = FlatPages(app)

@app.template_filter('strftime')
def format_datetime(value, format="%Y-%m-%d"):
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return value.strftime(format)

@app.route('/')
def home():
    posts = [p for p in pages if 'date' in p.meta]
    posts.sort(key=lambda item: item['date'], reverse=True)
    recent_posts = posts[:5]

    return render_template('index.html', posts=recent_posts)

@app.route('/blog/')
def blog():
    posts = [p for p in pages if 'date' in p.meta]
    posts.sort(key=lambda item: item['date'], reverse=True)
    return render_template('blog.html', posts=posts)

@app.route('/blog/<path:path>/')
def post(path):
    page = pages.get_or_404(path)
    return render_template('post.html', page=page)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    all_pages = list(pages)

    if not query:
        return render_template('blog.html', posts=[])

    results = []
    for p in all_pages:
        title = p.meta.get('title', '').lower()
        description = p.meta.get('description', '').lower()
        body = p.body.lower() if p.body else ""
        
        q = query.lower()

        if (q in title) or (q in body) or (q in description):
            results.append(p)
    
    return render_template('search.html', query=query, posts=results)

# --- 修正後的 API ---
@app.route('/api/posts')
def get_posts_json():
    posts_data = []
    for p in pages:
        if 'date' in p.meta:
            # 安全處理日期：可能是字串或 datetime
            raw_date = p.meta.get('date')
            if isinstance(raw_date, str):
                date_str = raw_date
            else:
                try:
                    date_str = raw_date.strftime('%Y-%m-%d') if raw_date else ''
                except Exception:
                    date_str = ''

            posts_data.append({
                'title': p.meta.get('title', ''),
                'url': url_for('post', path=p.path),
                'date': date_str,
                'description': p.meta.get('description', ''),
                'body': p.body if p.body else ''
            })
    return jsonify(posts_data)

if __name__ == '__main__':
    app.run(debug=True, port=5001)