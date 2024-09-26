
app.set('views', path.join(_dirname, 'views' ));
app.engine ('html ', require('ejs' ) .renderFile);
app.set ('view engine', 'html');

app.use (express.json());
app.use(express.urlencoded({ extended: falso }));
app.use (cookieParser ());
app.use (express. static (path. join(_dirname, 'public')));