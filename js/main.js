(function( $ ) {

	$(document).ready( function() {

		$('.confirm').click(function() {
	        return window.confirm("Are you sure?");
	    });

		$('#import_acton_field_names').on('click',function() {

			var data = {
				action: 'get_acton_fields',
				acton_url: $('#acton_url').val(),
				nonce: ajax_object.nonce,
			}

			$.post( ajax_object.ajaxurl, data, function( response ) {
				if( response ) {
					var JSONObject = $.parseJSON(response);
					$('#map_fields .field').not('.field_template').remove();
					$('#map_fields .field_template, #select_gravity_form, #field_headers').show();
					$.each(JSONObject, function(index,value) {
						$('#map_fields .field_template').clone().removeClass('field_template').appendTo('#map_fields');
						$('#map_fields .field:last input').val(value);
					});
					$('#map_fields .field_template').hide();
				}
			});

		});

		$('#import_gravity_form_field_names').on( 'click',function() {

			$('#gf_title').val($('#gf_forms_list option:selected').attr('data-title'));

			var data = {
				action: 'get_gravity_form_fields',
				gf_id: $('#gf_forms_list').val(),
				nonce: ajax_object.nonce,
			}

			$.post( ajax_object.ajaxurl, data, function( response ) {
				if( response ) {
					$('#save_mapping, #map_fields select.gf_fields').removeAttr('disabled');
					$('#map_fields select.gf_fields').empty().append( response );
				}
			});

		});

	});

}(jQuery));
