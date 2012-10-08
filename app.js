var express					= require('express'),
	app						= express(),
	request					= require('request'),
	jsdom					= require('jsdom'),
	nurl					= require('url'),
	icalendar				= require('./node-icalendar'),
	crypto					= require('crypto'),
	application_root		= __dirname,
	path					= require('path'),
	pub_dir					= path.join(application_root, './static'),
	fs						= require('fs');

app.use(express.bodyParser());
app.use(express.static(pub_dir));

app.get('/tt', function(req, res) {
	if (req.query.url && req.query.url.match(/https\:\/\/www\.(ei|ai)\.rub\.de\/studium\/(its|ai)\/(bachelor|master)\/po09\/stundenplaene\/([1-6]).semester\//)) {
		var url = req.query.url;
		var host = nurl.parse(url).host;
		var protocol = nurl.parse(url).protocol;
		var ical = new icalendar.iCalendar();
		var recurDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				jsdom.env(body, ['http://code.jquery.com/jquery-1.8.1.min.js'], function (errors, window) {
					var tds = window.$('td');
					var cnt = 0, cnt2 = 0;
					var datesAdded = {};
					tds.each(function() {
						if (window.$('a', this).length == 2) {
							var title = window.$(window.$('a strong', this)[0]).text();
							var prof = window.$(window.$('a', this)[1]).text();
							var chunks = window.$(this).html().split('<br />');
							var type = window.$.trim(chunks[2]);
							var time = window.$.trim(chunks[3]);

							var location = window.$.trim(chunks[4]);
							if (location.indexOf(',') !== -1) {
								chunks.splice(0,5);
								for (var i = 0; i < chunks.length; i++) {
									chunks[i] = window.$.trim(chunks[i]).replace(',', '');
								}
								location = chunks.join(', ');
							}

							var link = protocol + '//' + host + window.$(window.$('a', this)[0]).attr('href');

							jsdom.env(link, ['http://code.jquery.com/jquery-1.8.1.min.js'], function (errors, window) {
								var dates = window.$('ul.dates li');
								dates.each(function() {
									var cont = window.$.trim(window.$(this).text());
									var timestart = time.split('-')[0];
									var timeend = time.split('-')[1];
									var location_p = location;
									if (location_p.indexOf(',') !== -1) {
										location_p = location_p.split(',')[0];
									}
									if (cont.indexOf(type !== -1) && cont.indexOf(location_p) !== -1 && cont.indexOf(timestart) !== -1) {
										if (cont.indexOf('Montags') !== -1) {
											day = 0;
										}
										if (cont.indexOf('Dienstags') !== -1) {
											day = 1;
										}
										if (cont.indexOf('Mittwochs') !== -1) {
											day = 2;
										}
										if (cont.indexOf('Donnerstags') !== -1) {
											day = 3;
										}
										if (cont.indexOf('Freitags') !== -1) {
											day = 4;
										}
										var hash = crypto.createHash('md5').update(link + time + day).digest('hex');
										if (day !== undefined && datesAdded[hash] === undefined) {
											datesAdded[hash] = true;
											var event = ical.addComponent('VEVENT');
											event.setSummary(title + ' (' + type + ')');
											event.setDescription('bei ' + prof);
											event.setUrl(link);
											event.setLocation(location);
											event.setRecurWeekly(recurDays[day], new Date(2013, 1, 1, timestart.split(':')[0], timestart.split(':')[1], 0));
											event.setDate(new Date(2012, 9, day + 1 + 7, timestart.split(':')[0] - 2, timestart.split(':')[1], 0), new Date(2012, 9, day + 1 + 7, timeend.split(':')[0] - 2, timeend.split(':')[1], 0));
											//console.log(title, type, location, link, day);
										}
									}
								});
								cnt2++;
								if (cnt2 === cnt) {
									var hash = crypto.createHash('md5').update(url).digest('hex');
									var dir = path.join(pub_dir, './ics/' + hash);
									var filename = path.join(dir, './rubcalendar.ics');
									var puburl = './ics/' + hash + '/rubcalendar.ics';
									fs.mkdir(dir, function () {
										fs.writeFile(filename, ical.toString(), function (err) {
											if (err) {
												console.log(err);
											} else {
												res.send(puburl);
											}
										});
									});
								}
							});
							cnt++;
						}
					});
				});
			}

		});
	} else {
		res.send(403, 'No valid URL given!');
	}
});

app.listen(3000);