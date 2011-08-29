var Dawanda = {
	initialize: function() {
		this.dawanda_nav.initialize();
	},
	dawanda_nav: {
		opened: false,
		initialize: function() {
			var port = this;
			$('.dawanda_nav_open').click(function() {
				if (port.opened) {
					port.close();
				} else {
					port.open();
				}
			});
			$('.dawanda_nav_close').click(function() {
				port.close();
			});
		},
		open: function() {
			this.initial_top = $('#logo').css('top');
			$('#logo').animate({'top': '0px'}, 400);
			$('#dawanda_nav').slideDown(400, function() {
				$('.dawanda_nav_close').slideDown();
			});
			this.opened = true;
		},
		close: function() {
			$('.dawanda_nav_close').hide();
			$('#logo').animate({'top': this.initial_top}, 400);
			$('#dawanda_nav').slideUp(400);
			this.opened = false;
		}
	}
};


$(function() {
	Dawanda.initialize();
})