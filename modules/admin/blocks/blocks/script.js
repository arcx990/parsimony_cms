function blockAdminBlocks() {
    
    this.dragLastDomId = "";
    this.dragMiddle = 0;
    this.isAddBlock = false;
    this.blocks = [];
    
    this.startDragging = function () {
        ParsimonyAdmin.$currentBody.append(document.getElementById("dropInPage" ));
	$("#right_sidebar .mainTab").removeClass("active");
	$(".paneltree").addClass("active");
    }
    
    this.changeBlockPosition = function (blockType, idBlock, idNextBlock, startIdParentBlock, stopIdParentBlock, startTypeCont, stopTypeCont, action, content){
	if(typeof startIdParentBlock == "undefined" || typeof stopIdParentBlock == "undefined"){
	    alert(t('Error in your DOM, perhaps an HTML tag isn\'t closed.'));
	    return false
	    };
	if(idNextBlock == undefined || idNextBlock==idBlock) idNextBlock = "last";
	var contentToAdd = '';
	if(typeof content != "undefined") contentToAdd = content;
	ParsimonyAdmin.postData(BASE_PATH + "admin/" + action,{
	    TOKEN: TOKEN ,
	    popBlock: blockType ,
	    idBlock: idBlock,
	    id_next_block:idNextBlock ,
	    startParentBlock: startIdParentBlock ,
	    parentBlock:stopIdParentBlock ,
	    start_typecont:startTypeCont ,
	    stop_typecont:stopTypeCont ,
	    IDPage: $(".container_page",ParsimonyAdmin.currentBody).data('page'),
	    content: contentToAdd
	},function(data){
	    ParsimonyAdmin.execResult(data);
	    ParsimonyAdmin.returnToShelter();
	    ParsimonyAdmin.updateUI();
	});
    }
    
    this.loadEditMode = function () {
        $this = this;
        
        ParsimonyAdmin.$currentDocument.on('click.edit','.block',function(e){
            var blockInst = (typeof $this.blocks["block_" + this.classList[1]] != "undefined") ? $this.blocks["block_" + this.classList[1]] : $this.blocks['block_block'];
            blockInst.onClickEdit.apply(this, [e]);
        });
    }
    
    this.loadCreationMode = function () {
        $this = this;
	
	//Dispatch menu action event : configure / design / delete
        $(document).add('#config_tree_selector').on('click.creation',".config_destroy, .cssblock, .configure_block",function(e){
            var blockInst = (typeof $this.blocks["block_" + this.classList[1]] != "undefined") ? $this.blocks["block_" + this.classList[1]] : $this.blocks['block_block'];
            eval("blockInst." + $(this).data("action") + ".apply(this, [e]);");
        })
	/* Hide overlay when user don't pick a block */
        .on('mouseover.creation',"body", function(event) {
            document.getElementById("blockOverlay").style.display = "none";
        })
	.on('dragenter.creation',"#admintoolbar", function(e) {
	    e.stopPropagation();
	    ParsimonyAdmin.returnToShelter();
        });

        /* HTML5 drag n drop*/
        $("#panelblocks").on('dragstart.creation',".admin_core_block", function( event ){
            $this.isAddBlock = true;
            var evt = event.originalEvent;
            evt.dataTransfer.setDragImage(this,15,15);
            evt.dataTransfer.setData("parsimony/addblock", JSON.stringify({blockType:this.id}));
            evt.dataTransfer.effectAllowed = 'copy';
            $this.startDragging();
        });
        $("#menu").add('#paneltree').on('dragstart.creation',".move_block",function( event ){
            $this.isAddBlock = false;
            var evt = event.originalEvent;
            var elmt = $("#" + ParsimonyAdmin.inProgress,ParsimonyAdmin.currentBody);
            evt.dataTransfer.setDragImage(elmt[0],15,15);
	    var startTypeCont = ParsimonyAdmin.whereIAm(ParsimonyAdmin.inProgress);
            if(elmt.parent().closest(".container").hasClass("container_page")) startIdParentBlock = elmt.parent().closest(".container").data('page');
            else startIdParentBlock = elmt.parent().closest(".container").attr('id');
            if(startIdParentBlock == 'content') startIdParentBlock = $(".container_page",ParsimonyAdmin.currentBody).data('page');
            evt.dataTransfer.setData("parsimony/moveblock", JSON.stringify({idBlock:ParsimonyAdmin.inProgress,startIdParentBlock:startIdParentBlock,startTypeCont:startTypeCont}));
	    evt.dataTransfer.effectAllowed = 'copyMove';
            $this.startDragging();
        });
	
        $('#conf_box_content').on('click.creation',"#dialog-ok",function(e){
            e.preventDefault();
            var idBlock = $("#dialog-id").val();
	    var obj = JSON.parse($("#dialog-id-options").val());
            if(idBlock != ''){
                if( obj.idNextBlock == '' || obj.stopIdParentBlock == '' || ParsimonyAdmin.whereIAm("dropInTree") == '') alert("stop");
		var content = '';
		if(typeof obj.content != "undefined") content = obj.content;
                $this.changeBlockPosition(obj.blockType,idBlock,obj.idNextBlock,'',obj.stopIdParentBlock,'',ParsimonyAdmin.whereIAm("dropInTree"),"addBlock",content);
            }else{
                alert(t('Please enter your ID'));
            }
            ParsimonyAdmin.closeConfBox();
        });
	
        ParsimonyAdmin.$currentBody.on('click.creation','.block',function(e){
            var blockInst = (typeof $this.blocks["block_" + this.classList[1]] != "undefined") ? $this.blocks["block_" + this.classList[1]] : $this.blocks['block_block'];
	    blockInst.onClickCreation.apply(this, [e]);
        })
	.on('mouseover.creation',".block", function(event) {
            event.stopImmediatePropagation();
            var offset = this.getBoundingClientRect();
            var leftOffsetFrame = document.getElementById("parsiframe").offsetLeft;
            if(ParsimonyAdmin.inProgress != this.id) document.getElementById("blockOverlay").style.cssText = "display:block;top:" + offset.top + "px;left:" + (offset.left + leftOffsetFrame + 40) + "px;width:" + $(this).outerWidth() + "px;height:" + $(this).outerHeight() + "px";
            else document.getElementById("blockOverlay").style.display = "none";
        });

	ParsimonyAdmin.$currentBody.add('#paneltree')
	.on('dragenter.creation','.block,.tree_selector', function(e) {
	    if( e.originalEvent.dataTransfer.types != null){
		e.stopImmediatePropagation();
		//if(e.type == 'dragenter' || Math.floor ( Math.random() * 12 ) == 3) {
		var isContainer = false;
		if((this.classList.contains("container") && !this.classList.contains("tree_selector")) || this.id =='treedom_container') isContainer = true;
		if(e.type == 'dragenter' || ($this.dragLastDomId != this.id ||
		    ( $this.dragMiddlePos == 1 && (e.originalEvent.pageY > $this.dragMiddle)) ||
		    ( $this.dragMiddlePos == 0 && (e.originalEvent.pageY < $this.dragMiddle)))){
		    var theBlock = this;
		    if(this.classList.contains("tree_selector")) theBlock = ParsimonyAdmin.currentDocument.getElementById(this.id.split("treedom_")[1]);
		    var theBlockTree = document.getElementById("treedom_" + theBlock.id);
		    var dropInPage = ParsimonyAdmin.currentDocument.getElementById("dropInPage") || $("#dropInPage").appendTo(ParsimonyAdmin.currentBody).get(0);
                    $this.dragLastDomId = this.id;
		    $this.dragMiddle = $(this).offset().top + this.offsetHeight/2;
		    if(e.originalEvent.pageY < $this.dragMiddle && !isContainer){
                        if(!$this.isAddBlock && ParsimonyAdmin.inProgress == theBlock.id) return true;
			$this.dragMiddlePos = 1;
			$(theBlock).before(dropInPage);
			theBlockTree.parentNode.insertBefore(document.getElementById( "dropInTree" ),theBlockTree);
		    }else{
                        if(!$this.isAddBlock && theBlock.nextElementSibling.id == ParsimonyAdmin.inProgress) return true;
			$this.dragMiddlePos = 0;
			if(theBlock.classList.contains("container") && $(theBlock).children(".dropInContainer").length > 0){
			    if(!$this.isAddBlock && theBlock.id == ParsimonyAdmin.inProgress) return true;
                            $(".dropInContainerChild:first",theBlock).append(dropInPage);
			    theBlockTree.appendChild(document.getElementById( "dropInTree" ),theBlockTree);
			}else if(theBlock.classList.contains("container") && !isContainer){
			    theBlock.parentNode.insertBefore(dropInPage,theBlock);
			    theBlockTree.parentNode.insertBefore(document.getElementById( "dropInTree" ),theBlockTree);
			}else if(theBlock.parentNode.classList.contains("container") && !isContainer){
			    theBlock.parentNode.insertBefore(dropInPage,theBlock.nextSibling);
			    theBlockTree.parentNode.insertBefore(document.getElementById( "dropInTree" ),theBlockTree.nextSibling);
			}
		    }
		}
		dropInPage = theBlock = theBlockTree = null;
		return false;
	    }else{
		return true;
	    }
        })
	.on('dragover.creation','.block,.tree_selector', function(e) {
	    if( e.originalEvent.dataTransfer.types != null){
		e.stopImmediatePropagation();
		e.preventDefault(); /* Firefox fix */
		return false;
	    }else{
		return true;
	    }
        })
	.on('dragover.creation dragenter.creation','.marqueurdragndrop', function(e) {
            if( e.originalEvent.dataTransfer.types != null){
		e.stopImmediatePropagation();
		e.preventDefault(); /* Firefox fix */
		return false;
	    }else{
		return true;
	    }
        })
	.on('drop.creation','.container,.tree_selector',function( event ){
            event.stopPropagation();
            var evt = event.originalEvent;
            evt.preventDefault(); /* Firefox fix */
            evt.stopPropagation();
            var elmt = $( "#dropInPage" ,ParsimonyAdmin.currentBody);
            if(elmt.length > 0){
		var stopIdParentBlock = "";
                if(elmt.closest(".container").hasClass("container_page")) stopIdParentBlock = elmt.closest(".container").data('page');
                else stopIdParentBlock = elmt.closest(".container").attr('id');
                var idNextBlock = elmt.next(".block").attr('id');
		/* Move block action */
		if(evt.dataTransfer.getData("parsimony/moveblock").length > 0){
		    var obj = JSON.parse(evt.dataTransfer.getData("parsimony/moveblock"));
                    if(obj.idBlock == '' || idNextBlock == '' || obj.startIdParentBlock == '' || stopIdParentBlock == '' || obj.startTypeCont == '' || ParsimonyAdmin.whereIAm("dropInTree") == '') alert("stop");
                    $this.changeBlockPosition('',obj.idBlock,idNextBlock,obj.startIdParentBlock,stopIdParentBlock,obj.startTypeCont,ParsimonyAdmin.whereIAm("dropInTree"),"moveBlock");
                }else{
		    /* Add a block or other types of things */
		    var obj;
		    if(evt.dataTransfer.getData("parsimony/addblock").length > 0){
			obj = JSON.stringify({blockType:JSON.parse(evt.dataTransfer.getData("parsimony/addblock")).blockType,stopIdParentBlock:stopIdParentBlock,idNextBlock:idNextBlock});
		    }else if(evt.dataTransfer.getData("text/plain").length > 0){
			obj = JSON.stringify({blockType:"core\\blocks\\wysiwyg",stopIdParentBlock:stopIdParentBlock,idNextBlock:idNextBlock,content:evt.dataTransfer.getData("text/plain")});
		    }
		    else if(evt.dataTransfer.files  != null){
			/* todo, img upload for all modules/profiles */
			files = event.originalEvent.dataTransfer.files;
			var count = files.length;
			var maxFileSize = 1000000000;
			for (var i = 0; i < count; i++) {
			    var file = files[i];
			    if((files[i].type.match(new RegExp("image.*","g")))){
				if(maxFileSize > file.size){
				    var fd = new FormData();
				    fd.append("fileField", files[0]);
				    $.each({action: "upload",path: "profiles/www/modules/core/files",MODULE: MODULE,THEME: THEME,THEMETYPE: THEMETYPE,THEMEMODULE: THEMEMODULE }, function(i, val) {
					fd.append(i, val);
				    });
				    var xhr = new XMLHttpRequest();
				    xhr.open("POST", BASE_PATH + "admin/action");
				    xhr.upload.file = xhr.file = file;
				    xhr.upload.addEventListener("progress", function (event) {
					if (event.lengthComputable) {
					    var progress = (event.loaded / event.total) * 100;
					}
				    }, false);
				    xhr.addEventListener("load", function(event){
					 var response = jQuery.parseJSON(event.target.response)
					obj = JSON.stringify({blockType:"core\\blocks\\image",stopIdParentBlock:stopIdParentBlock,idNextBlock:idNextBlock,content:"core/files/" + response.name});
					$("#dialog-id-options").val(obj);
				    }, false);
				    xhr.send(fd);
				}
			    }
			}
		    }
		    
		    ParsimonyAdmin.displayConfBox("#dialog","Entrez un identifiant pour ce nouveau bloc");
		    $("#dialog-id-options").val(obj);
		    $("#dialog-id").val('').trigger("focus");
		}
		
            }
        });
    }
    
    this.unloadCreationMode =   function(){
	ParsimonyAdmin.$currentBody.add('#paneltree').add('#conf_box_content').add(document).add('#config_tree_selector').add("#menu").off('.creation');
    }
    
    this.setBlock = function (block) {
        this.blocks["block_" + block.name] = block;
    }

    
}


function block() {
    
    this.name = "block";
    
    var me = this;

    this.onClickEdit = function (e) {
	e.stopPropagation();
    }
    
    this.onClickCreation = function (e) {
        e.stopPropagation();
	    ParsimonyAdmin.selectBlock(this.id);
	    
        if(e.trad != true && e.link != true) ParsimonyAdmin.closeParsiadminMenu();
        ParsimonyAdmin.addTitleParsiadminMenu('#' + ParsimonyAdmin.inProgress);
        ParsimonyAdmin.addOptionParsiadminMenu('<a href="#" class="configure_block" rel="getViewConfigBlock" data-action="onConfigure" title="Configuration' + ' #' + ParsimonyAdmin.inProgress + '"><span class="ui-icon ui-icon-wrench floatleft"></span>'+ t('Configure') +'</a>');
	var CSSProps = '';
	if(typeof me.stylableElements != "undefined"){
	    $.each(me.stylableElements, function(index, value) { 
		CSSProps += '<a href="#" onclick="blockAdminCSS.displayCSSConf(CSSTHEMEPATH, \'#\' + ParsimonyAdmin.inProgress + \' ' + value + '\');return false;" data-css="' + value + '"><span class="ui-icon ui-icon-pencil floatleft"></span>'+ t('Design') + ' ' + t(index) + '</a>';
	    });
	    CSSProps = '<span class="ui-icon ui-icon-carat-1-e floatright"></span><div class="none CSSProps">' + CSSProps + '</a>';
	}
	ParsimonyAdmin.addOptionParsiadminMenu('<div class="CSSDesign"><a href="#" class="cssblock" data-action="onDesign"><span class="ui-icon ui-icon-pencil floatleft"></span>' + t('Design') + '</a>' + CSSProps + '</div>');
        if(this.id != "container") ParsimonyAdmin.addOptionParsiadminMenu('<a href="#" draggable="true" class="move_block" style="cursor:move"><span class="ui-icon ui-icon-arrow-4 floatleft"></span>'+ t('Move') +'</a>');
        if(this.id != "container" && this.id != "content") ParsimonyAdmin.addOptionParsiadminMenu('<a href="#" class="config_destroy" data-action="onDelete"><span class="ui-icon ui-icon-closethick floatleft"></span>'+ t('Delete') +'</a>');
        ParsimonyAdmin.openParsiadminMenu(e.pageX || ($(window).width()/2),e.pageY || ($(window).height()/2));
    }
    
    this.onConfigure = function () {
        var parentId = '';
        var inProgress = $("#treedom_" + ParsimonyAdmin.inProgress);
        if(inProgress.length > 0){
            if(inProgress.parent().closest(".container").attr("id") == "treedom_content") parentId = inProgress.parent().closest("#treedom_content").data('page');
            else parentId = inProgress.parent().closest(".container").attr('id').replace("treedom_","");
        }
        ParsimonyAdmin.displayConfBox(BASE_PATH + "admin/action",$(this).attr('title'),"TOKEN=" + TOKEN + "&idBlock=" + ParsimonyAdmin.inProgress + "&parentBlock=" + parentId + "&typeProgress=" + ParsimonyAdmin.typeProgress + "&action=" + $(this).attr('rel') +"&IDPage=" + $(".container_page",ParsimonyAdmin.currentBody).data('page'));
    }
    
    this.onDesign = function (e) {
        e.preventDefault();
	ParsimonyAdmin.selectBlock(ParsimonyAdmin.inProgress);
        blockAdminCSS.displayCSSConf(CSSTHEMEPATH, "#" + ParsimonyAdmin.inProgress);
    }
    
    this.onCreate = function () {
	
    }
    
    this.onDelete = function (e) {
        ParsimonyAdmin.destroyBlock();
    }
    
    this.onSaveConfig = function () {
	
    }
    
}