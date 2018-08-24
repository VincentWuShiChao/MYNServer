function showTable(){
    var obj = document.getElementById("logs"); //selectid
    var index = obj.selectedIndex; // ѡ������
    var text = obj.options[index].text;
    $.post('http://localhost:6001/BSM/showTable',{"text":text},function (data,status) {
      data=JSON.parse(data);
      alert(data.playerList.length);
      var table=document.getElementById("table");
      $("#table").empty();
      var tbody=document.createElement("tbody");
      table.appendChild(tbody);
      var tr=tbody.insertRow(0);
      tr.insertCell(tr.cells.length).innerHTML="";
      tr.insertCell(tr.cells.length).innerHTML="PID";
      tr.insertCell(tr.cells.length).innerHTML="用户名";
      tr.insertCell(tr.cells.length).innerHTML="战力";
      tr.insertCell(tr.cells.length).innerHTML="胜负场数";
      tr.insertCell(tr.cells.length).innerHTML="创建时间";
      tr.insertCell(tr.cells.length).innerHTML="登录类型";
      tr.insertCell(tr.cells.length).innerHTML="等级";
      tr.insertCell(tr.cells.length).innerHTML="经验";
      tr.insertCell(tr.cells.length).innerHTML="操作";


      for(let i=0;i<data.playerList.length;i++){
        var tr=tbody.insertRow(tbody.rows.length);
        tr.insertCell(tr.cells.length).innerHTML="";
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].pid;
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].name;
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].integral;
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].universal;
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].time;
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].logintype;
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].level;
        tr.insertCell(tr.cells.length).innerHTML=data.playerList[i].exper;
        tr.insertCell(tr.cells.length).innerHTML="<a href="+"'/BSM/editPlayerData?pid="+data.playerList[i].pid+"'>"+"编辑"+"</a>"
      }

    });
  }
function showNotice(){
  var obj = document.getElementById("notice");
  alert(obj.value);
  var text=obj.value;
  $.post('http://localhost:6001/BSM/showNotice',{"text":text},function (data,status) {
    data=JSON.parse(data);
    alert(data.msg);

  });
}
