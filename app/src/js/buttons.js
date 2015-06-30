/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$("#submitJoin").submit(function(event) {
    //vor get
    event.preventDefault();
    if($(this).find('input[name="gameid"]').val() === "" || $(this).find('input[name="password"]').val()=== ""){
        console.log("passiert was im if!")
    }
    console.log("passiert was!")
    //an Host
    $.get("http://localhost:8080/joinLobby",
            {
                id: $(this).find('input[name="gameid"]').val() ,
                pw: $(this).find('input[name="password"]').val(),
                name: "user"+Math.floor((Math.random() * 100) + 1)
            })
    .done(function(data, textStatus, xhr){
        //RETURN DATA $( ":mobile-pagecontainer" ).pagecontainer( "change", "confirm.html", { role: "dialog" } );
        $( ":mobile-pagecontainer" ).pagecontainer( "change", $("#lobby"), { role: "dialog" } );
    })
    .fail(function (xhr, textStatus, errorThrown) {
        if(xhr.status === 404){
            $("#submitJoin").find(".joinError").remove();
            $("#submitJoin").append("<p class='joinError ui-field-contain'>Diese Lobby existiert nicht</p>");
        }
        else if(xhr.status === 401){
            $("#submitJoin").find(".joinError").remove();
            $("#submitJoin").append("<p class='joinError ui-field-contain'>Das eingegebene Passwort ist Falsch</p>");
        }
        
    });
    

});

