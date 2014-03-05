$(function() {

    $('#side-menu').metisMenu();
	 
	 //Loads the correct sidebar on window load
    $(window).bind("load", function() {
        if ($(this).width() < 768) {
            $('div.sidebar-collapse').addClass('collapse')
        } else {
            $('div.sidebar-collapse').removeClass('collapse')
        }
    })
	 
	//Collapses the sidebar on window resize
    $(window).bind("resize", function() {
        if ($(this).width() < 768) {
            $('div.sidebar-collapse').addClass('collapse')
        } else {
            $('div.sidebar-collapse').removeClass('collapse')
        }
    })
})
