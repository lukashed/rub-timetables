var icalify = (function () {
	var courses = {
		'EI': {
			'ITS': {
				'Bachelor': [1, 2, 3, 4, 5, 6],
				'Master': [1, 2, 3, 4]
			},
			'AI': {
				'Bachelor': [1, 2, 3, 4, 5, 6],
				'Master': [1, 2, 3, 4]
			}
		}
	};
	var genlink = function (faculty, course, type, semester) {
		return 'https://www.' + faculty.toString().toLowerCase() + '.rub.de/studium/' + course.toString().toLowerCase() + '/' + type.toString().toLowerCase() + '/po09/stundenplaene/' + semester.toString().toLowerCase() + '.semester/';
	};

	return {
		courses: courses,
		genlink: genlink
	};
})();

$(function () {
	$('#faculty').change(function () {
		$('#buildit').addClass('disabled');
		icalify.faculty = $(this).val();
		$('#type, #semester').empty();
		$('#course').empty();
		$('.course').fadeIn();
		for (course in icalify.courses[icalify.faculty]) {
			$('#course').append($('<option/>').text(course));
		}
	});

	$('#course').change(function () {
		$('#buildit').addClass('disabled');
		icalify.course = $(this).val();
		$('#semester').empty();
		$('#type').empty();
		$('.type').fadeIn();
		for (type in icalify.courses[icalify.faculty][icalify.course]) {
			$('#type').append($('<option/>').text(type));
		}
	});

	$('#type').change(function () {
		$('#buildit').addClass('disabled');
		icalify.type = $(this).val();
		$('#semester').empty();
		$('.semester').fadeIn();
		for (semester in icalify.courses[icalify.faculty][icalify.course][icalify.type]) {
			$('#semester').append($('<option/>').text(parseInt(semester, 10) + 1));
		}
	});

	$('#semester').change(function () {
		icalify.semester = $(this).val();
		if (icalify.semester !== '') {
			$('#buildit').removeClass('disabled');
		}
	});

	$('#buildit').click(function (evt) {
		evt.preventDefault();
		var link = './tt?url=' + encodeURIComponent(icalify.genlink(icalify.faculty, icalify.course, icalify.type, icalify.semester));
		getIcs(link);
		return false;
	});

	var getIcs = function (link) {
		$('#loading').fadeIn();
		$.ajax({
			url: link,
			success: function (data) {
				$('#loading').fadeOut();
				if (data.indexOf('ics') !== -1) {
					location.href = data;
				} else {
					alert('No valid URL!');
				}
			},
			error: function () {
				$('#loading').fadeOut();
				alert('No valid URL!');
			}
		});
	};

	for (faculty in icalify.courses) {
		$('#faculty').append($('<option/>').text(faculty));
	}

	$('#linkform').submit(function (evt) {
		evt.preventDefault();
		getIcs('./tt?url=' + $('#linktext').val());
		return false;
	});
});