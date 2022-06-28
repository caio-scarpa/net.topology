import json
import os
import netmiko
import textfsm
from netmiko import ConnectHandler
import networkx as nx
import getpass
import re

class Device:
    def __init__(self, id, mgmt_ip, hostname, device_type):
        self.id = id
        self.mgmt_ip = mgmt_ip
        self.hostname = hostname
        self.device_type = device_type

    def __str__(self):
        return f'{self.hostname} with IP address {self.mgmt_ip} and ID {self.id}'

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Device) and self.hostname == other.hostname and self.mgmt_ip == other.mgmt_ip:
            return True
        return False

    def __hash__(self):
        return hash(str(self))

def get_cdp_neighbor_details(ip, username, password, enable_secret):
    """
    get the CDP neighbor detail from the device using SSH

    :param ip: IP address of the device
    :param username: username used for the authentication
    :param password: password used for the authentication
    :param enable_secret: enable secret
    :return:
    """
    # establish a connection to the device
    ssh_connection = ConnectHandler(
        device_type='cisco_ios',
        ip=ip,
        username=username,
        password=password,
        secret=enable_secret
    )

    # enter enable mode
    # ssh_connection.enable()

    # prepend the command prompt to the result (used to identify the local device)
    result = ssh_connection.find_prompt() + "\n"

    # execute the show cdp neighbor detail command
    # we increase the delay_factor for this command, because it take some time if many devices are seen by CDP
    result += ssh_connection.send_command("show cdp neighbor detail", delay_factor=2)

    # close SSH connection
    ssh_connection.disconnect()

    re_table = textfsm.TextFSM(open("show_cdp_neighbor_detail.textfsm"))
    fsm_results = re_table.ParseText(result)

    return fsm_results

def get_hostname(ip, username, password, enable_secret):
    """
    get the hostname from the device using SSH

    :param ip: IP address of the device
    :param username: username used for the authentication
    :param password: password used for the authentication
    :param enable_secret: enable secret
    :return:
    """
    # establish a connection to the device
    ssh_connection = ConnectHandler(
        device_type='cisco_ios',
        ip=ip,
        username=username,
        password=password,
        secret=enable_secret
    )

    # enter enable mode
    ssh_connection.enable()

    # Get the hostname of the actual device
    result = ssh_connection.find_prompt()

    # close SSH connection
    ssh_connection.disconnect()

    return result

def node_exists(nodelist, device):
    for node in nodelist:
        if (node.hostname == device[1].replace(".emea.fedex.com", "")) or (node.mgmt_ip == device[2]):
            return node
    return None

def edge_exists(edgelist, device):  #edgeList = list(net.edges(data=True))[0][2]; 
    for edge in edgelist:
        if device[1].replace(".emea.fedex.com", "") in edge[2].keys():
            if device[4] == edge[2][device[1].replace(".emea.fedex.com", "")]:
                return True
    return False   

def get_deviceType(hostname, device_model):
    if "csw" in hostname or "casw" in hostname or "C9500" in device_model:
        return "coreswitch"
    elif re.search("sw[0-9]", hostname) or re.search("SW[0-9]", hostname) or "C2960" in device_model or "C9300" in device_model:
        return "switch"
    elif "rc" in hostname or "rtr0" in hostname:
        return "router"
    elif "SEG" in hostname or "FTAP" in hostname:
        return "accesspoint"
    elif "WLC" in hostname:
        return "wlc"
    else:
        return "host"    

if __name__ == '__main__':

    target_ip = '10.206.160.2'  # input("Insert IP of the device: ")
    username = '4568027'  # input("Username: ")
    password = getpass.getpass("Password: ")
    secret = 'M3rt3ns&VP'  # getpass.getpass("Enable Password: ")

    net = nx.MultiGraph()  # graph objet
    counter = 1
    hostname = get_hostname(target_ip, username, password, secret).replace("#", "")  
    #node1 = Device(counter, target_ip, get_hostname(target_ip, username, password, secret).replace("#", ""))
    node1 = Device(counter, target_ip, hostname, get_deviceType(hostname, "test"))
    neighbors = get_cdp_neighbor_details(target_ip, username, password, secret)
    net.add_node(node1)
    print(node1.hostname + ": " + node1.device_type)

    for device in neighbors:
        result = node_exists(list(net.nodes()), device)

        if result is None:
            counter += 1
            node = Device(counter, device[2], device[1].replace(".emea.fedex.com", ""), get_deviceType(device[1], device[3]))
            net.add_node(node)
            net.add_edges_from([(node1, node, {node1.hostname: device[5], node.hostname: device[4]})])
            print(node.hostname + ": " + node.device_type)
        else:
            result_edge = edge_exists(list(net.edges(data=True)), device)
            if result_edge:
                continue
            net.add_edges_from([(node1, result, {node1.hostname: device[5], result.hostname: device[4]})])
    i = 0

    while i < len(list(net.nodes())):
        try:
            neighbors = get_cdp_neighbor_details(list(net.nodes())[i].mgmt_ip, username, password, secret)
        except (netmiko.ssh_exception.NetmikoTimeoutException, netmiko.ssh_exception.AuthenticationException):
            i += 1
            continue

        for device in neighbors:
            if device[2] == '':
                continue
            result = node_exists(list(net.nodes()), device)
            if result is None:
                counter += 1
                nodene = Device(counter, device[2], device[1].replace(".emea.fedex.com", ""), get_deviceType(device[1], device[3]))
                net.add_node(nodene)
                net.add_edges_from([(list(net.nodes())[i], nodene, {list(net.nodes())[i].hostname: device[5], nodene.hostname: device[4]})])
                print(nodene.hostname + ": " + nodene.device_type)
            else:
                result_edge = edge_exists(list(net.edges(data=True)), device)
                if result_edge:
                    continue
                net.add_edges_from([(list(net.nodes())[i], result, {list(net.nodes())[i].hostname: device[5], result.hostname: device[4]})])
        i += 1

    nodes = []
    aps = []
    hosts = []

    for node in net.nodes:
        if node.device_type == "host":
            #data_node = {"id": node.id, "label": node.hostname, "title": "<strong>Mgmt-IP:</strong><br>{}<br>".format(node.mgmt_ip)}
            data_node = {"id": node.id, "name": node.hostname, "ip": node.mgmt_ip , "device_type": node.device_type, "ssh_link": "ssh://" + node.mgmt_ip}
            hosts.append(data_node)
        elif node.device_type == "accesspoint":
            data_node = {"id": node.id, "name": node.hostname, "ip": node.mgmt_ip , "device_type": node.device_type, "ssh_link": "ssh://" + node.mgmt_ip}
            aps.append(data_node)
        else:
            data_node = {"id": node.id, "name": node.hostname, "ip": node.mgmt_ip , "device_type": node.device_type, "ssh_link": "ssh://" + node.mgmt_ip}
            nodes.append(data_node)

    edges = []
    for edge in net.edges(data=True):
        data_edge = {"source": edge[0].id, "target": edge[1].id, "from": edge[2][str(edge[0].hostname)], "to": edge[2][str(edge[1].hostname)]}
        edges.append(data_edge)

    data = {"nodes": nodes, "aps": aps, "hosts": hosts, "links": edges}

    aps_table = []
    aps_table.append(["AP Hostname", "Neighbor Interface", "Neighbor Hostname"])

    hosts_table = []
    hosts_table.append(["Host", "Neighbor Interface", "Neighbor Hostname"])

    for ap in aps:
        for link in edges:
            if link["target"] == ap["id"]:
                ap_neigh_interface = link["from"]
                ap_neigh_id = link["source"]
        for node in nodes:
            if node["id"] == ap_neigh_id:
                ap_neigh_hostname = node["name"]
        aps_table.append([ap["name"], ap_neigh_interface, ap_neigh_hostname])
    
    for host in hosts:
        for link in edges:
            if link["target"] == host["id"]:
                host_neigh_interface = link["from"]
                host_neigh_id = link["source"]
        for node in nodes:
            if node["id"] == host_neigh_id:
                host_neigh_hostname = node["name"]
        hosts_table.append([host["name"], host_neigh_interface, host_neigh_hostname])

    print("writing results to data.js...")
 
    datajs = "var topologyData = " + json.dumps(data, indent=4)
    apsjs = "var aps = " + json.dumps(aps_table, indent=4)
    hostsjs = "var hosts = " + json.dumps(hosts_table, indent=4)
    if os.path.exists("data.js"):
        os.remove("data.js")
    f = open("data.js", "w")
    f.write(datajs)
    f.write("\n" + apsjs)
    f.write("\n" + hostsjs)
    f.close()