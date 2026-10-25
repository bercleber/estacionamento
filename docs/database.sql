
CREATE DATABASE IF NOT EXISTS estacionamento
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE estacionamento;

-- 1. USUARIOS

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('ADMINISTRADOR', 'GERENTE', 'OPERADOR') NOT NULL DEFAULT 'OPERADOR',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_por INT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuarios_criado_por
        FOREIGN KEY (criado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;


-- 2. SESSOES_USUARIOS

CREATE TABLE sessoes_usuarios (
    usuario_id INT PRIMARY KEY,
    refresh_token_hash CHAR(64) NULL,
    refresh_expira_em DATETIME NULL,
    sessao_versao INT UNSIGNED NOT NULL DEFAULT 0,

    CONSTRAINT fk_sessoes_usuarios_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;


-- 3. VAGAS

CREATE TABLE vagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_por INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_vagas_criado_por
        FOREIGN KEY (criado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;


-- 4. CLIENTES

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NULL UNIQUE,
    telefone VARCHAR(20) NULL,
    tipo ENUM('MENSALISTA', 'HORISTA') NOT NULL,
    vaga_cativa_id INT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_por INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_clientes_vaga
        FOREIGN KEY (vaga_cativa_id) REFERENCES vagas(id),

    CONSTRAINT fk_clientes_criado_por
        FOREIGN KEY (criado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;


-- 5. ENDERECOS

CREATE TABLE enderecos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    logradouro VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(9) NULL,
    principal BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_enderecos_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB;


-- 6. VEICULOS

CREATE TABLE veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(100) NULL,
    cor VARCHAR(40) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_por INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_veiculos_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),

    CONSTRAINT fk_veiculos_criado_por
        FOREIGN KEY (criado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;


-- 7. TARIFAS

CREATE TABLE tarifas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    valor_hora DECIMAL(10,2) NOT NULL,
    valor_mes DECIMAL(10,2) NOT NULL,
    criado_por INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_tarifas_criado_por
        FOREIGN KEY (criado_por) REFERENCES usuarios(id),

    CONSTRAINT chk_tarifas_valor_hora
        CHECK (valor_hora >= 0),

    CONSTRAINT chk_tarifas_valor_mes
        CHECK (valor_mes >= 0)
) ENGINE=InnoDB;


-- 8. MOVIMENTACOES

CREATE TABLE movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    veiculo_id INT NOT NULL,
    vaga_id INT NOT NULL,
    placa_registrada VARCHAR(10) NOT NULL,
    tipo ENUM('MENSALISTA', 'HORISTA') NOT NULL,
    entrada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saida_em DATETIME NULL,
    valor_hora_aplicado DECIMAL(10,2) NULL,
    valor_total DECIMAL(10,2) NULL,
    usuario_entrada_id INT NOT NULL,
    usuario_saida_id INT NULL,

    CONSTRAINT fk_movimentacoes_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),

    CONSTRAINT fk_movimentacoes_veiculo
        FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),

    CONSTRAINT fk_movimentacoes_vaga
        FOREIGN KEY (vaga_id) REFERENCES vagas(id),

    CONSTRAINT fk_movimentacoes_usuario_entrada
        FOREIGN KEY (usuario_entrada_id) REFERENCES usuarios(id),

    CONSTRAINT fk_movimentacoes_usuario_saida
        FOREIGN KEY (usuario_saida_id) REFERENCES usuarios(id),

    CONSTRAINT chk_movimentacoes_valor_hora_aplicado
        CHECK (valor_hora_aplicado IS NULL OR valor_hora_aplicado >= 0),

    CONSTRAINT chk_movimentacoes_valor_total
        CHECK (valor_total IS NULL OR valor_total >= 0),

    CONSTRAINT chk_movimentacoes_datas
        CHECK (saida_em IS NULL OR saida_em >= entrada_em)
) ENGINE=InnoDB;
