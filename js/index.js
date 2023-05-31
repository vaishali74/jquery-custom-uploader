$(document).ready(function() {

    $('#files').customUploader({
    	extension: 'jpg,jpeg,png',
    	text: 'Drag images here'
    });

});

function getFiles() {
    var files = $.data($('#files')[0], 'customUploader').files;
    console.log(files);
}
