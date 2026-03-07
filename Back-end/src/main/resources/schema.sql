Table usuarios {
  id char(36) [pk]
  nome_usuario varchar(50) [not null]
  email varchar(150) [not null, unique]
  senha_hash varchar(255) [not null]
  status varchar(20) [not null, default: 'ativo']
  criado_em datetime [not null]
  atualizado_em datetime [not null]
}

Table vip_tiers {
  id char(36) [pk]
  nome varchar(50) [not null]
  descricao varchar(255)
  valor decimal(10,2) [not null]
  duracao_dias int [not null]
  ativo boolean [not null, default: true]
  criado_em datetime [not null]
}

Table compras {
  id char(36) [pk]
  usuario_id char(36) [not null]
  vip_tier_id char(36) [not null]
  valor decimal(10,2) [not null]
  status varchar(30) [not null, default: 'pendente']
  criado_em datetime [not null]
}

Table pagamentos {
  id char(36) [pk]
  compra_id char(36) [not null]
  metodo varchar(30) [not null]
  status varchar(30) [not null]
  transacao_externa varchar(100)
  pago_em datetime
  criado_em datetime [not null]
}

Table historico_eventos {
  id char(36) [pk]
  usuario_id char(36) [not null]
  compra_id char(36)
  tipo_evento varchar(50) [not null]
  descricao varchar(255) [not null]
  criado_em datetime [not null]
}

Ref: compras.usuario_id > usuarios.id
Ref: compras.vip_tier_id > vip_tiers.id
Ref: pagamentos.compra_id > compras.id
Ref: historico_eventos.usuario_id > usuarios.id
Ref: historico_eventos.compra_id > compras.id