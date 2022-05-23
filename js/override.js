var repdata=[];
jQuery( document ).ready(function($) {

	$('select[multiple]').multiselect({
	    showCheckbox : false,
	    selectAll : true,
	    minHeight : 0,
        texts: {
            placeholder    : js_trans.selectOptions,
            search         : js_trans.Search,
            selectedOptions: js_trans.selected,
            selectAll      : js_trans.selectAll,
            unselectAll    : js_trans.unselectAll,
            noneSelected   : js_trans.noneSelected
        }
	});

	////////////////////////////////////////////////////////////////////////////////////////////////
    // Find a Rep SVG
    ////////////////////////////////////////////////////////////////////////////////////////////////
    var $repM = $('#rep-map');
    ////////////////////////////////////////////////////////////////////////////////////////////////
    if( $repM.length )
    {
        var filterCenter  = $('#filter-center'),
            filterRegion  = $('#filter-region'),
            filterCountry = $('#filter-country'),
            filterZipCode = $('#filter-zip'),

            results = $('#results'),
            contact = $('#contact'),

            updateMap = function( region )
            {
                if( !region ) return;

                $('.selected', $repM).removeClass('selected');
                $('#'+region).addClass('selected');

                $('select', filterRegion).val( region );

                results.hide();
                contact.show();

                $('#msg-region').hide();
                $('#msg-country').show();

                filterCenter.removeClass().addClass('col-lg-6');

                filterCountry.removeClass('collaspe');
                filterZipCode.addClass('collaspe');

                $('select', filterCountry).val('');
                $('input', filterZipCode).val('');
            },

            updateResults = function()
            {
                //contact.hide();
                //results.show();
				console.log('updateResults');

                if( filterZipCode.hasClass('collaspe') && $('select', filterRegion).val() == 'north_america' )
                {
                    filterCenter.removeClass().addClass('col-lg-9');
                    filterZipCode.removeClass('collaspe');
                }
            };

		filterRegion.val('');
        filterCountry.val('');
        filterZipCode.val('');

        $('.map-section', $repM).click(function(){ updateMap( $(this).attr('id') ); });

        var selectRegion = $('select', filterRegion);
        selectRegion.on('change', function(){ updateMap( $(this).val() ); });
        updateMap( selectRegion.val() );

        $('select', filterCountry).on('change', updateResults);

        var getRegion = getUrlParameter('region');
        if( getRegion ) updateMap( getRegion );

        var getCountry = getUrlParameter('country');
        if( getCountry ) updateResults();
    }

    $('#filter form[data-ajax-submit=true] select').on('change', processFilterFormSubmit);
	$('#filter form[data-ajax-submit=true]').on('submit', processFilterFormSubmit);
	$('body').on('click','.js_clearfilters',function(e) {
		e.preventDefault();
		$('select[multiple]').multiselect( 'reset' );
		$('#filter form').trigger("reset").submit();
		aniScroll($('#filter'),1000,50);
	});

	function processFilterFormSubmit(e){
		e.preventDefault();
		var url = window.location.origin + window.location.pathname;
		var results_div = $( ".results-wrapper" ).length ? '.results-wrapper' : '#filter + section';

		// Load only the results section according to the new filters chosen
		$(results_div).load( url + " " + results_div + " .container", $('#filter form').serialize(), function() {
			if(e.isTrigger !== 3 || e.type != 'submit') { // Apparently this the value it gets when I trigger the form submit when you clear the filters. Multiselect has the same value, so I had to also add a check for the type of event

				// Change window URL
				url = window.location.origin + window.location.pathname + '?' + $('#filter form').serialize();

				// Only scroll if we're NOT doing a multiselect
				if(e.isTrigger !== 3) { aniScroll($(results_div),1000,50); }
			}

			// Make the back button work
	    	if(url!=window.location){
				window.history.pushState({path:url},document.title,url);
			}

			// Trigger the load more plugin
			var el = document.querySelector('.ajax-load-more-wrap');
			ajaxloadmore.start(el);
		});
	}


	$('.location-map .map-section').on('click', function() { repRegion(); });
	$('#filter-region #region').on('change', function() { repRegion(); });
	$('#filter-country #country').on('change', function() { repCountry(); });
	$('#filter-state #state').on('change', function() { displayRepResults(); });
	$('#filter-repcategory #repcategory').on('change', function() {
		var repcategory=$('#repcategory').val();
		var zip=$('#zip').val();
		if (repcategory!= '' && zip.length > 4) {
			displayRepResults();
		} else {
			$('#results').hide();
			$('#contact').show();
		}
	});
	$('#filter-zip #zip').on('keyup', function() {
		var repcategory=$('#repcategory').val();
		var zip=$('#zip').val();
		if (repcategory != '' && repcategory != null && zip.length > 4) {
			displayRepResults();
		}
	});
	repRegion();

    $('#career_view_all').on('click', function() {
    	$('#career_after8').show();
    	$('#career_view_all').hide();
	});

});

function repRegion() {
	$('#results').hide();
	var region=$('#region option:selected').text();
	$('#filter-state').addClass('collaspe');
	$('#filter-zip').addClass('collaspe');
	$('#filter-repcategory').addClass('collaspe');
	if ($('#region').val() != '' && region != '') {
		$('#country').html('<option value="">--Loading--</option>');
		$.getJSON( '/webfoo/wp-admin/admin-ajax.php?action=get_rep_data&region='+encodeURIComponent(region), function( data ) {
			repdata=data;
			var countries=[];
			if (repdata.length > 1) {
				var allothers=false;
				$.each( repdata, function( i, item ) {
					var country=item['country'];
					if (country == 'All Others' || country == '') {
						allothers=true;
					} else if (countries.indexOf(country) === -1) {
						countries.push(country);
					}
				});
				countries.sort();
				if (allothers) { countries.push('All Others'); }
				// var tmphtml='<option disabled="" value="">--All--</option>'+"\n";
				var tmphtml='<option value="">--All--</option>'+"\n";
				$.each( countries, function( i, item ) {
					tmphtml+='<option>'+item+'</option>'+"\n";
				});
				$('#country').html(tmphtml);
				$('#country')[0].selectedIndex=0;
				$('#filter-country').removeClass('collaspe');
			} else {
				$('#filter-country').addClass('collaspe');
				displayRepResults();
			}
		});
	} else {
		$('#filter-country').addClass('collaspe');
		$('#results').hide();
		$('#contact').show();
	}
}

function repCountry() {
	$('#results').hide();
	var country=$('#country').val();
	if (country == 'USA') {
		$('#filter-state').addClass('collaspe');
		$('#filter-zip').removeClass('collaspe');
		var cats=[];
		var allothers=false;
		$.each( repdata, function( i, item ) {
			if (item['country'] == 'USA') {
				var cat=item['rep_category'];
				for (var i=0; i<cat.length; i++) {
					if (cat[i] == 'All Others' || cat[i] == '') {
						allothers=true;
					} else if (cats.indexOf(cat[i]) === -1) {
						cats.push(cat[i]);
					}
				}
			}
		});
		cats.sort();
		if (allothers) { cats.push('All Others'); }
		// var tmphtml='<option disabled="" value="">--All--</option>'+"\n";
		var tmphtml='<option value="">--All--</option>'+"\n";
		$.each( cats, function( i, item ) {
			tmphtml+='<option>'+item+'</option>'+"\n";
		});
		$('#repcategory').html(tmphtml);
		$('#repcategory')[0].selectedIndex=0;
		$('#filter-repcategory').removeClass('collaspe');
	} else if (country == 'Canada') {
		$('#filter-zip').addClass('collaspe');
		$('#filter-repcategory').addClass('collaspe');
		var states=[];
		var allothers=false;
		$.each( repdata, function( i, item ) {
			if (item['country'] == 'Canada') {
				var state=item['state'];
				if (state == 'All Others' || state == '') {
					allothers=true;
				} else if (states.indexOf(state) === -1) {
					states.push(state);
				}
			}
		});
		states.sort();
		if (allothers) { states.push('All Others'); }
		// var tmphtml='<option disabled="" value="">--All--</option>'+"\n";
		var tmphtml='<option value="">--All--</option>'+"\n";
		$.each( states, function( i, item ) {
			tmphtml+='<option>'+item+'</option>'+"\n";
		});
		$('#state').html(tmphtml);
		$('#state')[0].selectedIndex=0;
		$('#filter-state').removeClass('collaspe');
	} else if (country == '') {
		$('#filter-state').addClass('collaspe');
		$('#filter-zip').addClass('collaspe');
		$('#filter-repcategory').addClass('collaspe');
		$('#results').hide();
		$('#contact').show();
	} else {
		$('#filter-state').addClass('collaspe');
		$('#filter-zip').addClass('collaspe');
		$('#filter-repcategory').addClass('collaspe');
		displayRepResults();
	}
}

function displayRepResults() {
	var region=$('#region option:selected').text();
	var country=$('#country').val();
	var state=$('#state').val();
	var repcategory=$('#repcategory').val();
	var zip=$('#zip').val();
	var tmphtml='';
	var num_results=0;
	$.each( repdata, function( i, item ) {
		var contact='<a href="/contact-us/find-a-rep/contact-rep/?rep_id='+item['ID']+'&country='+encodeURIComponent(country)+'&zip='+encodeURIComponent(zip)+'">Contact Rep</a>';
		if (region == 'Africa') {
			tmphtml+='<tr><td>'+item['agency_name']+'</td><td>'+region+'</td><td>'+contact+'</td></tr>';
			num_results++;
		} else if (country == 'USA') {
			if (item['country'] == country && item['rep_category'].indexOf(repcategory) !== -1 ) {
				var has_zip=false;
				$.each( item['zip_codes_covered'], function( i, item ) {
					if (item['min'] <= zip && item['max'] >= zip) { has_zip=true; }
				});
				if (has_zip) {
					tmphtml+='<tr><td>'+item['agency_name']+'</td><td>'+item['state']+'</td><td>'+country+'</td><td>'+region+'</td>><td>'+contact+'</td></tr>';
					num_results++;
				}
			}
		} else if (country == 'Canada') {
			if (item['country'] == country && item['state'] == state) {
				tmphtml+='<tr><td>'+item['agency_name']+'</td><td>'+state+'</td><td>'+country+'</td><td>'+region+'</td>><td>'+contact+'</td></tr>';
				num_results++
			}
		} else {
			if (item['country'] == country) {
				tmphtml+='<tr>><td>'+item['agency_name']+'</td><td>'+country+'</td><td>'+region+'</td><td>'+contact+'</td></tr>';
				num_results++
			}
		}
	});
	if (num_results == 1) {
		$('#rep_quantity').html('<b>'+num_results+' result</b>');
	} else {
		$('#rep_quantity').html('<b>'+num_results+' results</b>');
	}
	$('#rep_results > tbody').html(tmphtml);
	if (region == 'Africa') {
		$('#rep_results > thead').html('<tr><th>Company</th><th>Region</th><th>Contact</th></tr>');
	} else if (country == 'USA') {
		$('#rep_results > thead').html('<tr><th>Company</th><th>State</th><th>Country</th><th>Region</th><th>Contact</th></tr>');
	} else if (country == 'Canada') {
		$('#rep_results > thead').html('<tr><th>Company</th><th>State</th><th>Country</th><th>Region</th><th>Contact</th></tr>');
	} else {
		$('#rep_results > thead').html('<tr><th>Company</th><th>Country</th><th>Region</th><th>Contact</th></tr>');
	}
	$('#rep_results > tbody').html(tmphtml);
	$('#contact').hide();
	$('#results').show();
}
