var data = {};
var recdetails={};
function recallDoc(){
	ZOHO.CRM.CONNECTOR.isConnectorAuthorized("verticalsign").then(function(result)   // VerticalInventory Connector 
    {
        if(result == "false")
        {
        	alert("Zoho Sign didn't authorized");
				timeout = setTimeout(function() {
                	doNothing();
            	}, 1000);
        }else{
        	
			debugger;
			dMap = {};
			dMap.reqId = recdetails.Sign_Request_ID;
			dMap.remind = "recall";
			ZOHO.CRM.CONNECTOR.invokeAPI("verticalsign.remindrecipient",dMap)
                .then(function(result){
                	console.log(result);
                    var resp = JSON.parse(result.response);
                    if("success" ==resp.status ){
                    	debugger;                  			       			
	                      var config={
						  Entity:"Sign_Documents",
						  APIData:{
						        "id": data.pageLoadData.EntityId[0],
						        "Document_Status": "RECALLED"
						  },
						  Trigger:["workflow"]
						}
						ZOHO.CRM.API.updateRecord(config)
						.then(function(data){
						    console.log(data);
						    $("#msgTxt").text(resp.message);
		       				$("#msgDiv").show();
						    timeout = setTimeout(function() {
			                	
			                	ZOHO.CRM.UI.Popup.closeReload()
			            	}, 2000);
						})
                    }else{	
                    	$("#msgTxt").text(resp.message);
		       			$("#msgDiv").show();
		       			timeout = setTimeout(function() {			                	
			                	
			                	doNothing();
			            	}, 2000);
                    }                   	
                })
        }
    
    });
}

function doNothing(){
	ZOHO.CRM.UI.Popup.close();	
}

function initFunc(){
	ZOHO.CRM.API.getRecord({Entity:data.pageLoadData.Entity,RecordID:data.pageLoadData.EntityId[0]})
       .then(function(data){ 
		   console.log(data.data[0]);
       		recdetails = data.data[0];
       		signReqId = recdetails.Sign_Request_ID;
       		docStatus = recdetails.Document_Status;
       	
       		if( (docStatus == undefined || docStatus == null) || (docStatus.toUpperCase() !== "INPROGRESS" && docStatus.toUpperCase() !== "VIEWED") ){
       		
       			$("#msgTxt").text("Document Status is "+docStatus+", So can't recall this document");
       			$("#msgDiv").show();
       			timeout = setTimeout(function() {
                	doNothing();
            	}, 2000);
       		}else{
       			$("#confirmDiv").show();
       		}
        })
}