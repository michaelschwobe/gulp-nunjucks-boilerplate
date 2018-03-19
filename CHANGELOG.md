# 2.1.0

- Renamed classnames/ids for body and body > div  
- Added 'isProd' key/value to nunjucks render data  
- Added 'version' key/value to nunjucks render data, implemented styles and scripts cache busting  
- Added site fallbacks for page titles and meta descriptions  
- Fixed gulpfile bug: 'data' is already declared in the upper scope  

# 2.0.0

- Removed eslint  
- Rearchitected build system and folder/file structures  
- Updated gulp-nunjucks-render to version 2.2.x, which uses nunjucks version ^3.0.0  
- Added nunjucks data injection via data.json  

# 1.2.1

- Pinned dependencies with yarn lockfile  

# 1.2.0

- Updated dependencies and build file  
- Added option to use a different PORT  
- Renamed ‘assets’ folder to ‘public’  
- Renamed ‘page.html’ partial to ‘main.html’  

# 1.1.1

- Fixed styles still calling BEM classes  
- Moved formatting arguments to the CLI  

# 1.1.0

- Minify HTML in production is now optional  
- Dotfiles in assets folder get moved to output  
- Add imagemin optimization defaults  
- Added option to reformat HTML when in production  
- Add typical page elements (header, main, footer)  
- Add summary content block  
- Remove BEM and extra text  
- Cleanup head and foot partials  

# 1.0.0

- Initial commit  
