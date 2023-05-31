if(typeof Object.create !== 'function') {

	Object.create =  function ( obj ) {

		function F() {};
		F.prototype = obj;
		return new F();

	};

}

(function( $, window, document, undefined ) {

	var Uploader = {

		//files: {},

		init: function( options, input ) {

			var self = this;

			self.files = [];

			self.options = $.extend( {}, $.fn.customUploader.options, options );

			self.input = input;
			self.$_input = $( input );

			// SET INITIAL MARKUP
			self.$_input.wrap('<div class="_cu color-dark"></div>');
			$('<ul class="_cu_list"></ul>').insertAfter(self.input);
			$('<div class="_cu_errors"></div>').insertAfter(self.input);
			self.$_input.wrap('<div class="_cu_fileselector border border-dashed"></div>');
			self.$_input.wrap('<div class="_cu_droparea text-center"></div>');
			self.$_input.before(self.options.text + '<br>'+self.options.sep+'<br>');
			self.$_input.wrap('<a class="btn btn-primary _cu_upload_btn"></a>');
			self.$_input.before(self.options.btn);
			self.$_input.addClass('_cu_file');

			self.$_cu = self.$_input.closest('._cu');
			self.$_cu_droparea = self.$_cu.find('._cu_droparea');
			self.$_cu_list = self.$_cu.find('._cu_list');
			self.$_cu_errors = self.$_cu.find('._cu_errors');
			self.showFileInfoMessage();

			// BIND EVENTS
			self.bindEvents();

		},

		extensionValidationRequired: function() {
			var self = this;
			if(typeof self.options.extension === 'string' && $.trim(self.options.extension) != '') {
				return true;
			}
			return false;
		},

		filecountValidationRequired: function() {
			var self = this;
			if(self.options.maxallowed !== null) {
				if(isNaN(self.options.maxallowed)) {
					return false;
				}
				else {
					return true;
				}
			}
			return false;
		},

		filesizeValidationRequired: function() {
			var self = this;
			if(self.options.maxallowedsize !== null) {
				if(isNaN(self.options.maxallowedsize)) {
					return false;
				}
				else {
					return true;
				}
			}
			return false;
		},

		fileInfoRequired: function() {
			var self = this;
			if(self.options.fileinfo !== null) {
				return true;
			}
			return false;
		},

		getFileSize: function() {
			var self = this;
			var size = 0;
			$.each(self.files, function(i, file) {
				size += parseInt(file.size);
			});
			return size;
		},

		getFilesLeft: function() {
			return parseInt(this.options.maxallowed) - this.files.length;
		},

		getSizeLeft: function(file) {

			var allowedsize = parseFloat(this.options.maxallowedsize) * 1024 * 1024;
			var totalsize 	= this.getFileSize();
			if(file) {
				totalsize += parseInt(file.size);
			}
			var sizeleft = allowedsize - totalsize;
			if(sizeleft < 0) { sizeleft = 0; }
			return sizeleft;

		},

		validateSelectedFiles: function(files) {

			var errors 			= [];
			var self 			= this;
			var checkextension 	= self.extensionValidationRequired();
			var checkfilecount 	= self.filecountValidationRequired();
			var checkfilesize	= self.filesizeValidationRequired();

			// LOOP ALL FILES
			$.each(files, function(i, file) {

				var allok = true;

				// CHECK FILE EXTENSION
				if(checkextension === true) {

					var extension 			= file.name.substr((file.name.lastIndexOf('.')+1)).toLowerCase();
					var allowedExtensions 	= self.options.extension.toLowerCase().split(',');

					if($.inArray(extension, allowedExtensions) === -1) {
						allok = false;
					}

				}

				// EXTENSION VALIDATION SUCCESS
				if(allok) {

					// CHECK FILE COUNT
					if(checkfilecount === true) {
						if(self.getFilesLeft() == 0) {
							allok = false;
						}
					}

					// FILE COUNT VALIDATION SUCCESS
					if(allok) {

						// CHECK FILE SIZE
						if(checkfilesize === true) {

							if(self.getSizeLeft(file) == 0) {
								allok = false;
							}

						}

						// FILE SIZE VALIDATION SUCCESS
						if(allok) {

							self.files.push(file);

						}
						// FILE SIZE VALIDATION FAIL
						else {

							errors.push({
								file: file,
								errormessage: self.options.validation.sizeexceeded
							});

						}

					}
					// FILE COUNT VALIDATION FAIL
					else {
						errors.push({
							file: file,
							errormessage: self.options.validation.maxfilesselected
						});
					}

				}
				// EXTENSION VALIDATION FAIL
				else {
					errors.push({
						file: file,
						errormessage: self.options.validation.filenotallowed
					});
				}

			});

			self.showErrors(errors);

		},

		bindFileChange: function() {

			var self = this;
			self.$_input.change(function(e) {

				self.validateSelectedFiles(self.$_input[0].files);
				self.display();

		    });

		},

		bindDragDrop: function() {

			var self = this;

		    self.$_cu_droparea.on('dragenter', function (e) {
			  	e.preventDefault();
			  	e.stopPropagation();
			  	self.$_cu.addClass('_cu_dragenter');
			})
			.on('dragover',function(e) {
			    e.preventDefault();
			    e.stopPropagation();
			})
			.on('dragleave', function(e) {
			  	self.$_cu.removeClass('_cu_dragenter');
			})
		    .on('drop', function (e) {
			  	e.preventDefault();
			  	e.stopPropagation();
			  	self.$_cu.removeClass('_cu_dragenter');
			  	if(e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {

			  		self.validateSelectedFiles(e.originalEvent.dataTransfer.files);
				  	self.display();

		        }
			});

		},

		bindRemoveItem: function() {

			var self = this;

			self.$_cu_list.on('click', '._cu_delete', function() {
				var litoremove = $(this).closest('li');
				var index = self.$_cu_list.find('li').index(litoremove);
				self.files.splice(index, 1);
				$(this).closest('li').slideUp(function() {
					$(this).remove();
				});
				self.showFileInfoMessage();
			});

		},

		bindEvents: function() {

			var self = this;
			self.bindFileChange();
			self.bindDragDrop();
			self.bindRemoveItem();

		},

		showErrors: function(errors) {

			var self 	= this;
			var errorhtml = '';
			if(typeof errors === 'object' && errors.length > 0) {
				errorhtml = '<div class="alert alert-danger alert-dismissible fade in" role="alert">'+
  								'<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
  									'<span aria-hidden="true">&times;</span>'+
  								'</button>'+
  								'<div class="_cu_error_caption"><span class="fa fa-exclamation-triangle"></span>'+self.options.validation.caption+'</div>'+
  								'<ul>';
				$.each(errors, function(i, error) {
					errorhtml += '<li><b>'+error.file.name+':</b> '+error.errormessage+'</li>';
				});
				errorhtml += '</ul></div>';
			}
			self.$_cu_errors.html(errorhtml);

		},

		display: function() {

			var self = this;
			self.$_cu_list.empty();
			var fragment = '';

		    if(self.files.length > 0) {

		    	$.each(self.files, function(i, file) {

		    		var fileName = file.name;
		    		var fileSize = file.size;

		            var $_li 			= $('<li>');
		            var $_cu_li_in 		= $('<div class="_cu_li_in">');
		            var $_cu_thumb 		= $('<div class="_cu_thumb">').html(self.getFileIcon(file));
		            var $_cu_filename 	= $('<div class="_cu_filename">').html(fileName);
		            var $_cu_filesize 	= $('<div class="_cu_filesize">').html('(' + self.formatFileSize(fileSize) + ')');
		            var $_cu_delete 	= $('<div class="_cu_delete">').html('<i class="fa fa-close"></i>');

		            $_cu_li_in.append($_cu_thumb);
		            $_cu_li_in.append($_cu_filename);
		            $_cu_li_in.append($_cu_filesize);
		            $_cu_li_in.append($_cu_delete);
		            $_li.html($_cu_li_in);

		             self.$_cu_list.append($_li);

		    	});

		    	$(fragment).hide().appendTo(self.$_cu_list).fadeIn(1000);

		    }

		    self.showFileInfoMessage();

		},

		showFileInfoMessage: function() {

			var self = this;
			var fileinfodiv = $(self.options.fileinfo);

			if(self.fileInfoRequired() === true && fileinfodiv.length > 0) {

				var info = '';

				var checkfilecount 	= self.filecountValidationRequired();
				var checkfilesize	= self.filesizeValidationRequired();

				if(checkfilecount === true && checkfilesize === true) {
					var filesleft = self.getFilesLeft();
					var sizeleft = self.formatFileSize(self.getSizeLeft());
					if(filesleft == 1) {
						info = self.options.fileinfomessages.fileleftunder.replace('{size}', sizeleft);
					}
					else {
						info = self.options.fileinfomessages.filesleftunder.replace('{size}', sizeleft)
																	.replace('{count}', filesleft);
					}
				}
				else if(checkfilecount === true) {
					var filesleft = self.getFilesLeft();
					if(filesleft == 1) {
						info = self.options.fileinfomessages.fileleft;
					}
					else {
						info = self.options.fileinfomessages.filesleft.replace('{count}', filesleft);;
					}
				}
				else if(checkfilesize === true) {
					info = self.options.fileinfomessages.sizeleft.replace('{size}', self.formatFileSize(self.getSizeLeft()));
				}

				fileinfodiv.html(info);

			}

		},

		getFileIcon: function(file) {

			var icon_class;
			var fileName 		= file.name
			var is_image 		= false;
			var icon_base_class = 'fa';
			var extension 		= fileName.substr((fileName.lastIndexOf('.')+1)).toLowerCase();

			switch(extension) {
		        case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp':
		        	is_image 	= true;
		        	icon_class 	= 'fa-file-image-o';
		        break;

		        case 'xls': case 'xlsx':
		            icon_class = 'fa-file-excel-o';
		        break;

		        case 'ppt': case 'pptx':
		            icon_class = 'fa-file-powerpoint-o';
		        break;

		        case 'doc': case 'docx':
		            icon_class = 'fa-file-word-o';
		        break;

		        case 'zip': case 'rar':
		            icon_class = 'fa-file-archive-o';
		        break;

		        case 'pdf':
		            icon_class = 'fa-file-pdf-o';
		        break;

		        case 'mp3':
		            icon_class = 'fa-file-audio-o';
		        break;

		        case 'php': case 'css': case 'js': case 'html': case 'json': case 'xml':
		            icon_class = 'fa-file-code-o';
		        break;

		        case 'mp4': case 'webm':
		            icon_class = 'fa-file-video-o';
		        break;

		        case 'txt':
		            icon_class = 'fa-file-text-o';
		        break;

		        default:
		            icon_class = 'fa-file-o';
		        break;
		    }

		    if(is_image) {

		        var $image = $('<img>');
		    	var reader = new FileReader();
		        reader.onload = function (e) {
		            $image.attr('src', e.target.result);
		        }
			    reader.readAsDataURL(file);
			    return $image[0];

		    }
		    else {
		    	return '<i class="'+ icon_base_class + ' ' + icon_class +'"></i>';
		    }

		},

		formatFileSize: function(bytes, decimalPoint) {
		   if(bytes == 0) return '0 Bytes';
		   var k = 1024,
		       dm = decimalPoint || 2,
		       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		       i = Math.floor(Math.log(bytes) / Math.log(k));
		   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
		}

	};

	$.fn.customUploader = function( options ) {

		return this.each(function() {

			var uploader = Object.create( Uploader );
			uploader.init(options, this);

			$.data( this, 'customUploader', uploader );

		});

	};

	$.fn.customUploader.options = {
		// extension		: 'jpg,jpeg,png,docx',
	    text			: 'Drag images here',
	    sep 			: 'or',
	    btn 			: 'Upload',
	    maxallowed 		: null,
	    maxallowedsize 	: null, // in MB
	    validation 		:  {
	    	caption 			: 'One or more invalid file selected',
	    	maxfilesselected	: 'Max allowed files already selected',
	    	sizeexceeded 		: 'Max allowed size exceeded',
	    	filenotallowed 		: 'File not allowed'
	    },
	    fileinfo 			: null,
	    fileinfomessages	: {
	    	fileleftunder 	: '1 file left under {size}',
	    	filesleftunder 	: '{count} files left under {size}',
	    	fileleft 		: '1 file left',
	    	filesleft 		: '{count} files left',
	    	sizeleft 		: '{size} left'
	    }
	};

})( jQuery, window, document );