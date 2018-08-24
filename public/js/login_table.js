function Apply(){
    var obj = document.getElementById("logs"); //selectid
    var index = obj.selectedIndex; // ѡ������
    var text = obj.options[index].text;
    $.post('http://localhost:6001/BSM/Apply',{"text":text},function (data,status) {
      data=JSON.parse(data);
      alert(data.logs_list.length);
      var table=document.getElementById("table");
      $("#table").empty();
      var tbody=document.createElement("tbody");
      table.appendChild(tbody);
      var tr=tbody.insertRow(0);
      tr.insertCell(tr.cells.length).innerHTML="";
      tr.insertCell(tr.cells.length).innerHTML="ID";
      tr.insertCell(tr.cells.length).innerHTML="用户名";
      tr.insertCell(tr.cells.length).innerHTML="登陆时间";
      tr.insertCell(tr.cells.length).innerHTML="登录次数";
      tr.insertCell(tr.cells.length).innerHTML="ip解析";

      for(let i=0;i<data.logs_list.length;i++){
        var tr=tbody.insertRow(tbody.rows.length);
        tr.insertCell(tr.cells.length).innerHTML="";
        tr.insertCell(tr.cells.length).innerHTML=data.logs_list[i].id;
        tr.insertCell(tr.cells.length).innerHTML=data.logs_list[i].name;
        tr.insertCell(tr.cells.length).innerHTML=data.logs_list[i].loginTime;
        tr.insertCell(tr.cells.length).innerHTML=data.logs_list[i].count;
        tr.insertCell(tr.cells.length).innerHTML=JSON.stringify(data.logs_list[i].ipAddr);
      }

    });
  }